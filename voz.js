"use strict";

(() => {
  const botao = document.getElementById("botaoVoz");
  const status = document.getElementById("statusVoz");
  const listaServicos = document.getElementById("listaServicos");

  if (!botao || !status || !listaServicos) {
    console.error("Não foi possível iniciar a função de voz: elementos do HTML não encontrados.");
    return;
  }

  const ReconhecimentoDeVoz =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!ReconhecimentoDeVoz) {
    botao.disabled = true;
    status.textContent =
      "O reconhecimento de voz não é compatível com este navegador. Tente usar o Chrome atualizado.";
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
      .replace(/\bcoating\b/g, "vitrificacao")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function obterServicosDisponiveis() {
    const servicos = [];

    listaServicos.querySelectorAll(".servico").forEach(linha => {
      const checkboxPrincipal = linha.querySelector(
        ":scope > .checkbox-servico"
      );

      const labelPrincipal = linha.querySelector(
        ":scope > label.servico-nome"
      );

      const nomePrincipal =
        linha.dataset.nome ||
        (labelPrincipal ? labelPrincipal.textContent.trim() : "");

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

        const labelOpcao = linhaOpcao.querySelector("label.servico-nome");

        const nomeOpcao =
          linhaOpcao.dataset.nome ||
          (labelOpcao ? labelOpcao.textContent.trim() : "");

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
    const disponiveis = obterServicosDisponiveis();
    const encontrados = new Set();

    disponiveis.forEach(servico => {
      if (
        servico.nomeNormalizado &&
        fala.includes(servico.nomeNormalizado)
      ) {
        encontrados.add(servico);
      }
    });

    if (encontrados.size > 0) {
      return [...encontrados];
    }

    const partesFaladas = fala
      .split(/\b(?:e|mais|tambem)\b|,/)
      .map(parte => parte.trim())
      .filter(Boolean);

    partesFaladas.forEach(parte => {
      const correspondencias = disponiveis.filter(servico => {
        const palavras = servico.nomeNormalizado
          .split(" ")
          .filter(palavra => palavra.length > 2);

        if (palavras.length === 0) {
          return false;
        }

        const palavrasEncontradas = palavras.filter(palavra =>
          parte.includes(palavra)
        );

        return palavrasEncontradas.length >= Math.min(2, palavras.length);
      });

      if (correspondencias.length === 1) {
        encontrados.add(correspondencias[0]);
      }
    });

    return [...encontrados];
  }

  function marcarServico(servico) {
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
    const encontrados = localizarServicos(transcricao);

    if (encontrados.length === 0) {
      status.textContent =
        `Ouvi: “${transcricao}”, mas não identifiquei os serviços. ` +
        "Tente falar os nomes como aparecem na lista, separados por “e”.";
      return;
    }

    const nomes = encontrados.map(servico => servico.nome);
    const confirmou = window.confirm(
      `Ouvi: “${transcricao}”.\n\n` +
      `Serviços identificados:\n${nomes.join("\n")}\n\n` +
      "Deseja adicioná-los ao orçamento?"
    );

    if (!confirmou) {
      status.textContent = "Nenhum serviço foi alterado.";
      return;
    }

    encontrados.forEach(marcarServico);
    status.textContent = `Serviços adicionados: ${nomes.join(", ")}.`;
  }

  botao.addEventListener("click", () => {
    if (reconhecimentoEmAndamento) {
      return;
    }

    reconhecimentoEmAndamento = true;
    botao.disabled = true;
    status.textContent =
      "Ouvindo. Fale os serviços que deseja adicionar, separados por “e”.";

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
    const resultado = evento.results[evento.resultIndex];
    const transcricao =
      resultado && resultado[0] ? resultado[0].transcript.trim() : "";

    if (!transcricao) {
      status.textContent = "Não consegui entender. Tente falar novamente.";
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
        "Não detectei fala. Tente novamente, falando perto do microfone.",
      "audio-capture":
        "Não encontrei um microfone disponível neste aparelho.",
      network:
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