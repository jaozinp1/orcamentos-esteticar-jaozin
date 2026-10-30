"use strict";

(() => {
  const botao = document.getElementById("botaoVoz");
  const status = document.getElementById("statusVoz");
  const listaServicos = document.getElementById("listaServicos");

  if (!botao || !status || !listaServicos) {
    console.error(
      "Função de voz: confira se o HTML contém os elementos botaoVoz, statusVoz e listaServicos."
    );
    return;
  }

  const Reconhecimento =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Reconhecimento) {
    botao.disabled = true;
    status.textContent =
      "O reconhecimento de voz não está disponível neste navegador. Tente pelo Chrome atualizado.";
    return;
  }

  const reconhecimento = new Reconhecimento();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = false;
  reconhecimento.maxAlternatives = 3;

  let ouvindo = false;

  function normalizar(texto) {
    return String(texto || "")
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function obterNomeDaLinha(linha) {
    const label = linha.querySelector(":scope > label.servico-nome");
    return linha.dataset.nome || (label ? label.textContent.trim() : "");
  }

  function obterServicosDisponiveis() {
    const disponiveis = [];

    listaServicos.querySelectorAll(".servico").forEach(linha => {
      const checkboxPrincipal = linha.querySelector(
        ":scope > .checkbox-servico"
      );
      const nomePrincipal = obterNomeDaLinha(linha);

      if (checkboxPrincipal && nomePrincipal) {
        disponiveis.push({
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
          disponiveis.push({
            nome: nomeOpcao,
            nomeNormalizado: normalizar(nomeOpcao),
            checkbox: checkboxOpcao,
            checkboxPai: checkboxPrincipal
          });
        }
      });
    });

    return disponiveis;
  }

  function correspondeVitrificacao(fala, nomeServico) {
    const nome = normalizar(nomeServico);

    if (!nome.includes("vitrificacao")) {
      return false;
    }

    const falaTemVitrificacao =
      /\bvitrifica(?:cao|cao|r)?\b/.test(fala) ||
      /\bvitrifica\b/.test(fala) ||
      /\bvitrificacao\b/.test(fala);

    if (!falaTemVitrificacao) {
      return false;
    }

    if (nome.includes("pintura")) {
      return /\bpintura\b/.test(fala);
    }

    if (nome.includes("plasticos")) {
      return /\bplasticos?\b/.test(fala);
    }

    if (nome.includes("metais")) {
      return /\bmetais?\b/.test(fala);
    }

    return fala.includes(nome);
  }

  function correspondeServico(fala, servico) {
    if (correspondeVitrificacao(fala, servico.nome)) {
      return true;
    }

    if (fala.includes(servico.nomeNormalizado)) {
      return true;
    }

    const nome = servico.nomeNormalizado;

    // Aceita "vitrifica pintura/plástico/metais" mesmo que a transcrição
    // não reconheça corretamente a palavra "vitrificação".
    if (nome.includes("vitrificacao")) {
      return correspondeVitrificacao(fala, servico.nome);
    }

    return false;
  }

  function localizarServicos(transcricao) {
    const fala = normalizar(transcricao);
    const disponiveis = obterServicosDisponiveis();
    const encontrados = [];

    disponiveis.forEach(servico => {
      if (
        correspondeServico(fala, servico) &&
        !encontrados.some(item => item.checkbox === servico.checkbox)
      ) {
        encontrados.push(servico);
      }
    });

    return encontrados;
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
        `Ouvi: “${transcricao}”, mas não encontrei esse serviço na lista. ` +
        "Selecione primeiro Moto ou Carro e tente dizer o nome do serviço.";
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
    if (ouvindo) return;

    ouvindo = true;
    botao.disabled = true;
    status.textContent =
      "Ouvindo. Diga um ou mais serviços, por exemplo: “vitrifica pintura e vitrifica plásticos”.";

    try {
      reconhecimento.start();
    } catch (erro) {
      ouvindo = false;
      botao.disabled = false;
      status.textContent =
        "Não consegui iniciar o microfone. Aguarde um instante e tente novamente.";
      console.error("Erro ao iniciar o reconhecimento de voz:", erro);
    }
  });

  reconhecimento.addEventListener("result", evento => {
    const resultados = evento.results[evento.resultIndex];
    const transcricao =
      resultados && resultados[0] ? resultados[0].transcript.trim() : "";

    if (!transcricao) {
      status.textContent = "Não consegui entender. Tente falar novamente.";
      return;
    }

    processarTranscricao(transcricao);
  });

  reconhecimento.addEventListener("error", evento => {
    const mensagens = {
      "not-allowed":
        "O acesso ao microfone foi bloqueado. Permita o uso do microfone nas configurações do navegador.",
      "service-not-allowed":
        "O navegador não permitiu iniciar o reconhecimento de voz.",
      "no-speech":
        "Não detectei fala. Tente novamente, falando perto do microfone.",
      "audio-capture":
        "Não encontrei um microfone disponível.",
      network:
        "O reconhecimento de voz falhou por um problema de conexão."
    };

    status.textContent =
      mensagens[evento.error] ||
      `O reconhecimento de voz falhou (${evento.error}).`;
  });

  reconhecimento.addEventListener("end", () => {
    ouvindo = false;
    botao.disabled = false;
  });
})();