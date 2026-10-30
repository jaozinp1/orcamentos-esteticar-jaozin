"use strict";

(() => {
  const botao = document.getElementById("botaoVoz");
  const listaServicos = document.getElementById("listaServicos");

  if (!botao || !listaServicos) {
    console.error(
      "Voz: não encontrei o botão botaoVoz ou a lista listaServicos no HTML."
    );
    return;
  }

  let status = document.getElementById("statusVoz");

  if (!status) {
    status = document.createElement("p");
    status.id = "statusVoz";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    botao.insertAdjacentElement("afterend", status);
  }

  const Reconhecimento =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const estilo = document.createElement("style");
  estilo.textContent = `
    #botaoVoz {
      width: 58px;
      height: 58px;
      min-width: 58px;
      min-height: 58px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: #1769aa;
      cursor: pointer;
      position: relative;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, background-color 0.2s ease;
    }

    #botaoVoz:hover {
      transform: scale(1.06);
    }

    #botaoVoz:disabled {
      cursor: wait;
      opacity: 1;
    }

    #botaoVoz svg {
      width: 27px;
      height: 27px;
      display: block;
      fill: currentColor;
    }

    #botaoVoz.ouvindo {
      background: #d93636;
      animation: pulsoMicrofone 1.2s infinite;
    }

    #botaoVoz.ouvindo::before {
      content: "";
      position: absolute;
      inset: -7px;
      border: 2px solid rgba(217, 54, 54, 0.6);
      border-radius: 50%;
      animation: ondaMicrofone 1.2s infinite;
      pointer-events: none;
    }

    #statusVoz {
      min-height: 1.4em;
    }

    @keyframes pulsoMicrofone {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    @keyframes ondaMicrofone {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(1.35); opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      #botaoVoz.ouvindo,
      #botaoVoz.ouvindo::before {
        animation: none;
      }
    }
  `;
  document.head.appendChild(estilo);

  botao.type = "button";
  botao.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z"/>
    </svg>
  `;
  botao.setAttribute("aria-label", "Falar serviços");
  botao.title = "Falar serviços";

  if (!Reconhecimento) {
    botao.disabled = true;
    status.textContent =
      "O reconhecimento de voz não está disponível neste navegador. Tente usar o Chrome atualizado.";
    return;
  }

  const reconhecimento = new Reconhecimento();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = true;
  reconhecimento.maxAlternatives = 5;

  let ouvindo = false;
  let transcricaoFinal = "";
  let erroReconhecimento = "";

  function normalizar(texto) {
    return String(texto || "")
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function obterNomeServico(linha) {
    const label = linha.querySelector(":scope > label.servico-nome");
    return linha.dataset.nome || (label ? label.textContent.trim() : "");
  }

  function obterServicosDisponiveis() {
    const servicos = [];

    listaServicos.querySelectorAll(".servico").forEach(linha => {
      const checkboxPrincipal = linha.querySelector(
        ":scope > .checkbox-servico"
      );
      const nomePrincipal = obterNomeServico(linha);

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

  function falaIndicaVitrificacao(fala) {
    return /\bvitrifica\w*\b/.test(fala) || /\bcoating\b/.test(fala);
  }

  function identificarTiposFalados(fala) {
    const tipos = [];

    if (/\bpintura\b/.test(fala)) {
      tipos.push("pintura");
    }

    if (/\bplasticos?\b/.test(fala)) {
      tipos.push("plasticos");
    }

    if (/\bmetais?\b/.test(fala)) {
      tipos.push("metais");
    }

    return tipos;
  }

  function servicoEhVitrificacao(servico) {
    return (
      servico.nomeNormalizado.includes("vitrificacao") ||
      servico.nomeNormalizado.includes("coating")
    );
  }

  function localizarServicos(transcricao) {
    const fala = normalizar(transcricao);
    const servicos = obterServicosDisponiveis();
    const encontrados = [];
    const vitrificacaoFalou = falaIndicaVitrificacao(fala);
    const tiposFalados = identificarTiposFalados(fala);

    if (vitrificacaoFalou) {
      if (tiposFalados.length === 0) {
        return {
          encontrados: [],
          precisaInformarTipo: true
        };
      }

      servicos.forEach(servico => {
        if (!servicoEhVitrificacao(servico)) {
          return;
        }

        const correspondeAoTipo = tiposFalados.some(tipo =>
          servico.nomeNormalizado.includes(tipo)
        );

        if (correspondeAoTipo) {
          encontrados.push(servico);
        }
      });

      return {
        encontrados,
        precisaInformarTipo: false
      };
    }

    servicos.forEach(servico => {
      if (
        servico.nomeNormalizado &&
        fala.includes(servico.nomeNormalizado)
      ) {
        encontrados.push(servico);
      }
    });

    return {
      encontrados,
      precisaInformarTipo: false
    };
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
    const resultado = localizarServicos(transcricao);

    if (resultado.precisaInformarTipo) {
      status.textContent =
        `Ouvi “${transcricao}”. Diga também se é vitrificação de pintura, plásticos ou metais.`;
      return;
    }

    if (resultado.encontrados.length === 0) {
      status.textContent =
        `Ouvi “${transcricao}”, mas não encontrei esse serviço na lista. ` +
        "Confira se o tipo de veículo está selecionado.";
      return;
    }

    const nomes = resultado.encontrados.map(servico => servico.nome);
    const confirmou = window.confirm(
      `Ouvi: “${transcricao}”.\n\n` +
        `Serviço(s) identificado(s):\n${nomes.join("\n")}\n\n` +
        "Deseja adicioná-los ao orçamento?"
    );

    if (!confirmou) {
      status.textContent = "Nenhum serviço foi alterado.";
      return;
    }

    resultado.encontrados.forEach(marcarServico);
    status.textContent = `Adicionado: ${nomes.join(", ")}.`;
  }

  function encerrarAnimacao() {
    ouvindo = false;
    botao.disabled = false;
    botao.classList.remove("ouvindo");
    botao.setAttribute("aria-label", "Falar serviços");
    botao.title = "Falar serviços";
  }

  botao.addEventListener("click", () => {
    if (ouvindo) {
      return;
    }

    transcricaoFinal = "";
    erroReconhecimento = "";
    ouvindo = true;
    botao.disabled = true;
    botao.classList.add("ouvindo");
    botao.setAttribute("aria-label", "Microfone ativado, ouvindo");
    botao.title = "Ouvindo";
    status.textContent =
      "Microfone ativado. Diga, por exemplo: “vitrifica pintura” ou “vitrifica metais”.";

    try {
      reconhecimento.start();
    } catch (erro) {
      encerrarAnimacao();
      status.textContent =
        "Não consegui iniciar o microfone. Verifique a permissão do navegador e tente novamente.";
      console.error("Erro ao iniciar o reconhecimento de voz:", erro);
    }
  });

  reconhecimento.addEventListener("result", evento => {
    let textoParcial = "";

    for (
      let indice = evento.resultIndex;
      indice < evento.results.length;
      indice++
    ) {
      const resultado = evento.results[indice];
      const texto = resultado[0] ? resultado[0].transcript : "";

      if (resultado.isFinal) {
        transcricaoFinal += ` ${texto}`;
      } else {
        textoParcial += ` ${texto}`;
      }
    }

    const textoAtual = (transcricaoFinal || textoParcial).trim();

    if (textoAtual) {
      status.textContent = `Ouvindo: “${textoAtual}”`;
    }
  });

  reconhecimento.addEventListener("error", evento => {
    const mensagens = {
      "not-allowed":
        "O acesso ao microfone foi bloqueado. Permita o microfone nas configurações do navegador.",
      "service-not-allowed":
        "O navegador não permitiu usar o reconhecimento de voz.",
      "no-speech":
        "Não detectei fala. Toque no microfone novamente e fale perto dele.",
      "audio-capture":
        "Não encontrei um microfone disponível.",
      network:
        "O reconhecimento de voz falhou por um problema de conexão."
    };

    erroReconhecimento =
      mensagens[evento.error] ||
      `O reconhecimento de voz falhou (${evento.error}).`;

    status.textContent = erroReconhecimento;
  });

  reconhecimento.addEventListener("end", () => {
    const fala = transcricaoFinal.trim();

    encerrarAnimacao();

    if (fala) {
      processarTranscricao(fala);
    } else if (!erroReconhecimento) {
      status.textContent =
        "Não consegui captar uma frase. Toque no microfone e tente novamente.";
    }
  });
})();