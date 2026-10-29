"use strict";

(() => {
  const botao = document.getElementById("botaoVoz");
  const status = document.getElementById("statusVoz");
  const listaServicos = document.getElementById("listaServicos");

  if (!botao || !status || !listaServicos) {
    console.error("Não foi possível iniciar o recurso de voz: faltam elementos no HTML.");
    return;
  }

  const ReconhecimentoDeVoz =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!ReconhecimentoDeVoz) {
    botao.disabled = true;
    status.textContent =
      "O reconhecimento de voz não é compatível com este navegador. Tente usar outro navegador atualizado.";
    return;
  }

  const reconhecimento = new ReconhecimentoDeVoz();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = false;
  reconhecimento.maxAlternatives = 3;

  let reconhecimentoEmAndamento = false;

  function normalizar(texto) {
    return texto
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function obterOpcoesDeServicoVisiveis() {
    const resultado = [];

    listaServicos.querySelectorAll(".servico").forEach(linha => {
      const checkboxPrincipal = linha.querySelector(
        ":scope > .checkbox-servico"
      );

      const nomePrincipal = linha.dataset.nome || "";

      if (checkboxPrincipal && nomePrincipal) {
        resultado.push({
          nome: nomePrincipal,
          nomeNormalizado: normalizar(nomePrincipal),
          checkbox: checkboxPrincipal,
          checkboxPai: null,
          linhaPai: linha
        });
      }

      linha.querySelectorAll(".servico-opcao").forEach(linhaOpcao => {
        const checkboxOpcao = linhaOpcao.querySelector(
          ".checkbox-opcao-servico"
        );

        const nomeOpcao = linhaOpcao.dataset.nome || "";

        if (!checkboxOpcao || !nomeOpcao) {
          return;
        }

        resultado.push({
          nome: nomeOpcao,
          nomeNormalizado: normalizar(nomeOpcao),
          checkbox: checkboxOpcao,
          checkboxPai: checkboxPrincipal,
          linhaPai: linha
        });
      });
    });

    return resultado;
  }

  function localizarCorrespondencias(transcricao) {
    const falaNormalizada = normalizar(transcricao);

    if (!falaNormalizada) {
      return [];
    }

    return obterOpcoesDeServicoVisiveis().filter(servico => {
      return (
        servico.nomeNormalizado.length > 0 &&
        falaNormalizada.includes(servico.nomeNormalizado)
      );
    });
  }

  function selecionarServico(servico) {
    if (servico.checkboxPai && !servico.checkboxPai.checked) {
      servico.checkboxPai.checked = true;
      servico.checkboxPai.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }

    if (!servico.checkbox.checked) {
      servico.checkbox.checked = true;
      servico.checkbox.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }
  }

  function atualizarStatus(transcricao, correspondencias) {
    const nomes = correspondencias.map(servico => servico.nome);
    const mensagem =
      `Ouvi: “${transcricao}”. Encontrei estes serviços:\n\n` +
      nomes.join("\n") +
      "\n\nDeseja adicioná-los ao orçamento?";

    if (!window.confirm(mensagem)) {
      status.textContent = "Nenhum serviço foi alterado.";
      return;
    }

    correspondencias.forEach(selecionarServico);

    status.textContent =
      `Serviços adicionados: ${nomes.join(", ")}.`;
  }

  botao.addEventListener("click", () => {
    if (reconhecimentoEmAndamento) {
      return;
    }

    reconhecimentoEmAndamento = true;
    botao.disabled = true;
    status.textContent = "Ouvindo. Fale o nome dos serviços que deseja adicionar.";

    try {
      reconhecimento.start();
    } catch (erro) {
      reconhecimentoEmAndamento = false;
      botao.disabled = false;
      status.textContent =
        "Não foi possível iniciar o microfone. Aguarde um momento e tente novamente.";
      console.error("Erro ao iniciar o reconhecimento de voz:", erro);
    }
  });

  reconhecimento.addEventListener("result", evento => {
    const resultados = evento.results[evento.resultIndex];
    const transcricao = resultados && resultados[0]
      ? resultados[0].transcript.trim()
      : "";

    if (!transcricao) {
      status.textContent =
        "Não consegui entender o que foi dito. Tente falar novamente.";
      return;
    }

    const correspondencias = localizarCorrespondencias(transcricao);

    if (correspondencias.length === 0) {
      status.textContent =
        `Ouvi: “${transcricao}”, mas não encontrei um serviço correspondente ` +
        "na lista exibida. Fale o nome do serviço como aparece no orçamento.";
      return;
    }

    atualizarStatus(transcricao, correspondencias);
  });

  reconhecimento.addEventListener("error", evento => {
    const mensagens = {
      "not-allowed":
        "O acesso ao microfone foi negado. Permita o uso do microfone nas configurações do navegador.",
      "service-not-allowed":
        "O navegador não permitiu o uso do reconhecimento de voz.",
      "no-speech":
        "Não detectei fala. Tente novamente e fale perto do microfone.",
      "audio-capture":
        "Não encontrei um microfone disponível neste aparelho.",
      "network":
        "O reconhecimento de voz falhou por um problema de conexão."
    };

    status.textContent =
      mensagens[evento.error] ||
      `O reconhecimento de voz não funcionou (${evento.error}).`;
  });

  reconhecimento.addEventListener("end", () => {
    reconhecimentoEmAndamento = false;
    botao.disabled = false;
  });
})();