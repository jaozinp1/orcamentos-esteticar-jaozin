"use strict";

(() => {
  const botao = document.getElementById("botaoVoz");
  const status = document.getElementById("statusVoz");
  const listaServicos = document.getElementById("listaServicos");

  if (!botao || !status || !listaServicos) {
    console.error(
      "Não foi possível iniciar o recurso de voz: faltam elementos no HTML."
    );
    return;
  }

  const ReconhecimentoDeVoz =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const substituicoesVitrificacao = [
    [/\bcoating de pintura\b/gi, "Vitrificação de pintura"],
    [/\bcoating de plásticos\b/gi, "Vitrificação de plásticos"],
    [/\bcoating de plasticos\b/gi, "Vitrificação de plásticos"],
    [/\bcoating de metais\b/gi, "Vitrificação de metais"],
    [/\bcoating\b/gi, "Vitrificação"]
  ];

  function substituirCoating(texto) {
    let resultado = texto;

    substituicoesVitrificacao.forEach(([expressao, substituicao]) => {
      resultado = resultado.replace(expressao, substituicao);
    });

    return resultado;
  }

  function atualizarNomesDeVitrificacao() {
    listaServicos.querySelectorAll(".servico").forEach(linha => {
      if (linha.dataset.nome) {
        linha.dataset.nome = substituirCoating(linha.dataset.nome);
      }

      const labelPrincipal = linha.querySelector(
        ":scope > label.servico-nome"
      );

      if (labelPrincipal) {
        labelPrincipal.textContent = substituirCoating(
          labelPrincipal.textContent
        );
      }

      linha.querySelectorAll(".servico-opcao").forEach(linhaOpcao => {
        if (linhaOpcao.dataset.nome) {
          linhaOpcao.dataset.nome = substituirCoating(
            linhaOpcao.dataset.nome
          );
        }

        const labelOpcao = linhaOpcao.querySelector("label.servico-nome");

        if (labelOpcao) {
          labelOpcao.textContent = substituirCoating(
            labelOpcao.textContent
          );
        }
      });
    });

    listaServicos.querySelectorAll(".titulo-secao-servicos").forEach(titulo => {
      titulo.textContent = substituirCoating(titulo.textContent);
    });
  }

  atualizarNomesDeVitrificacao();

  const observador = new MutationObserver(() => {
    atualizarNomesDeVitrificacao();
  });

  observador.observe(listaServicos, {
    childList: true,
    subtree: true
  });

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

  function obterServicosDisponiveis() {
    atualizarNomesDeVitrificacao();

    const servicos = [];

    listaServicos.querySelectorAll(".servico").forEach(linha => {
      const checkboxPrincipal = linha.querySelector(
        ":scope > .checkbox-servico"
      );

      const nomePrincipal = linha.dataset.nome || "";

      if (checkboxPrincipal && nomePrincipal) {
        servicos.push({
          nome: nomePrincipal,
          nomeNormalizado: normalizar(nomePrincipal),
          checkbox: checkboxPrincipal,
          checkboxPai: null
        });
      }

      linha.querySelectorAll(".servico-opcao").forEach(linhaOpcao => {
        const checkboxOpcao = linhaOpcao.querySelector(
          ".checkbox-opcao-servico"
        );

        const nomeOpcao = linhaOpcao.dataset.nome || "";

        if (checkboxOpcao && nomeOpcao) {
          servicos.push({
            nome: nomeOpcao,
            nomeNormalizado: normalizar(nomeOpcao),
            checkbox: checkboxOpcao,
            checkboxPai: checkboxPrincipal
          });
        }
      });
    });

    return servicos;
  }

  function localizarServicos(transcricao) {
    const fala = normalizar(transcricao);
    const servicosDisponiveis = obterServicosDisponiveis();
    const encontrados = [];

    servicosDisponiveis.forEach(servico => {
      if (!servico.nomeNormalizado) {
        return;
      }

      if (fala.includes(servico.nomeNormalizado)) {
        encontrados.push(servico);
      }
    });

    if (encontrados.length > 0) {
      return encontrados;
    }

    const termosFalados = fala
      .split(/\s+(?:e|mais|tambem|também)\s+|,\s*/g)
      .map(termo => termo.trim())
      .filter(Boolean);

    termosFalados.forEach(termo => {
      const correspondencias = servicosDisponiveis.filter(servico => {
        const palavrasServico = servico.nomeNormalizado
          .split(" ")
          .filter(palavra => palavra.length > 2);

        if (palavrasServico.length === 0) {
          return false;
        }

        const palavrasEncontradas = palavrasServico.filter(palavra =>
          termo.includes(palavra)
        );

        return (
          palavrasEncontradas.length >=
          Math.min(2, palavrasServico.length)
        );
      });

      if (correspondencias.length === 1) {
        encontrados.push(correspondencias[0]);
      }
    });

    return [...new Set(encontrados)];
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

  function processarTranscricao(transcricao) {
    const servicosEncontrados = localizarServicos(transcricao);

    if (servicosEncontrados.length === 0) {
      status.textContent =
        `Ouvi: “${transcricao}”, mas não consegui identificar os serviços. ` +
        "Tente falar os nomes dos serviços como aparecem na lista, separados por “e” ou por pausas.";
      return;
    }

    const nomes = servicosEncontrados.map(servico => servico.nome);
    const confirmacao = window.confirm(
      `Ouvi: “${transcricao}”.\n\n` +
      `Encontrei estes serviços:\n${nomes.join("\n")}\n\n` +
      "Deseja adicioná-los ao orçamento?"
    );

    if (!confirmacao) {
      status.textContent = "Nenhum serviço foi alterado.";
      return;
    }

    servicosEncontrados.forEach(selecionarServico);

    status.textContent =
      `Serviços adicionados: ${nomes.join(", ")}.`;
  }

  botao.addEventListener("click", () => {
    if (reconhecimentoEmAndamento) {
      return;
    }

    reconhecimentoEmAndamento = true;
    botao.disabled = true;
    status.textContent =
      "Ouvindo. Fale todos os serviços que deseja adicionar, separados por “e” ou por pausas.";

    try {
      reconhecimento.start();
    } catch (erro) {
      reconhecimentoEmAndamento = false;
      botao.disabled = false;
      status.textContent =
        "Não foi possível iniciar o microfone. Aguarde um momento e tente novamente.";
      console.error(
        "Erro ao iniciar o reconhecimento de voz:",
        erro
      );
    }
  });

  reconhecimento.addEventListener("result", evento => {
    const resultado = evento.results[evento.resultIndex];
    const transcricao = resultado && resultado[0]
      ? resultado[0].transcript.trim()
      : "";

    if (!transcricao) {
      status.textContent =
        "Não consegui entender a fala. Tente novamente.";
      return;
    }

    processarTranscricao(transcricao);
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