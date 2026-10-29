"use strict";

const listaServicos = document.getElementById("listaServicos");
const campoTipoVeiculo = document.getElementById("tipoVeiculo");
const campoPorteVeiculo = document.getElementById("porteVeiculo");

let contadorIds = 0;
let servicosPersonalizados = [];

const catalogos = {
  Carro: [
    {
      secao: "Lavação",
      servicos: [
        {
          nome: "Lavação convencional",
          precos: { Pequeno: 70, Médio: 80, Grande: 100 }
        },
        {
          nome: "Lavação detalhada",
          precos: { Pequeno: 130, Médio: 170, Grande: 230 }
        }
      ]
    },
    {
      secao: "Polimento e pintura",
      servicos: [
        {
          nome: "Polimento comercial",
          precos: { Pequeno: 400, Médio: 500, Grande: 700 }
        },
        {
          nome: "Polimento técnico",
          precos: { Pequeno: 900, Médio: 1000, Grande: 1200 }
        },
        {
          nome: "Revitalização de pintura",
          precos: { Pequeno: 130, Médio: 180, Grande: 230 }
        }
      ]
    },
    {
      secao: "Coating e proteção",
      servicos: [
        { nome: "Cera líquida", valor: 10 },
        { nome: "Coating de pintura", vitrificadoresCarro: true },
        { nome: "Coating de plásticos", valor: "" },
        { nome: "Enceramento premium em pasta", valor: 80 },
        { nome: "Selagem da pintura", valor: 80 },
        { nome: "Selagem de plásticos", valor: 80 },
        {
          nome: "Revitalização de plásticos internos e externos",
          valor: 40
        },
        {
          nome: "Tratamento de vidro — descontaminação, cristalização e hidrorepelência",
          valor: 200
        }
      ]
    },
    {
      secao: "Higienização",
      servicos: [
        {
          nome: "Higienização",
          menu: [
            {
              nome: "Desmontagem e remontagem dos componentes internos",
              valor: 150
            },
            {
              nome: "Higienização interna completa",
              valor: 400
            },
            {
              nome: "Limpeza detalhada do assoalho",
              valor: 150
            },
            {
              nome: "Remoção do carpete do assoalho",
              valor: 50
            },
            {
              nome: "Higienização do teto",
              valor: 70
            }
          ]
        },
        { nome: "Higienização de bancos de tecido", valor: 250 },
        {
          nome: "Higienização de bancos de couro com condicionamento",
          valor: 300
        }
      ]
    },
    {
      secao: "Faróis",
      servicos: [
        { nome: "Polimento de farol", valor: 150 },
        { nome: "Restauração de farol", valor: 250 }
      ]
    },
    {
      secao: "Motor",
      servicos: [
        { nome: "Limpeza convencional do motor", valor: 100 },
        { nome: "Limpeza detalhada do motor", valor: 200 }
      ]
    }
  ],

  Moto: [
    {
      secao: "Lavação",
      servicos: [
        { nome: "Lavação convencional", valor: 40 },
        { nome: "Lavação detalhada", valor: 100 }
      ]
    },
    {
      secao: "Polimento",
      servicos: [
        {
          nome: "Polimento comercial",
          precos: { Pequeno: 120, Médio: 220, Grande: 250 },
          categorias: {
            Pequeno: "Naked",
            Médio: "Carenada",
            Grande: "Big trail"
          }
        },
        {
          nome: "Polimento técnico",
          precos: { Pequeno: 230, Médio: 330, Grande: 350 },
          categorias: {
            Pequeno: "Naked",
            Médio: "Carenada",
            Grande: "Big trail"
          }
        },
        {
          nome: "Polimento de motor",
          opcoes: [
            { nome: "Tampa coração", valor: 70 },
            { nome: "Tampa de válvulas", valor: 120 },
            { nome: "Aletas do cilindro", valor: 150 },
            { nome: "Cabeçote", valor: 150 }
          ]
        }
      ]
    },
    {
      secao: "Coating e proteção",
      servicos: [
        {
          nome: "Coating de pintura",
          vitrificadoresMoto: { "2 anos": 150, "5 anos": 270 }
        },
        {
          nome: "Coating de plásticos",
          vitrificadoresMoto: { "2 anos": 120, "5 anos": 240 }
        },
        { nome: "Coating de metais", valor: 100 },
        { nome: "Selagem da pintura", valor: 30 },
        { nome: "Selagem de plásticos", valor: 30 },
        { nome: "Cera líquida", valor: 10 },
        { nome: "Cera em pasta premium", valor: 30 }
      ]
    },
    {
      secao: "Revitalização",
      servicos: [
        { nome: "Revitalização de pintura", valor: 60 },
        { nome: "Revitalização de plásticos", valor: 15 },
        { nome: "Restauração de plástico injetado", valor: 150 }
      ]
    },
    {
      secao: "Faróis",
      servicos: [
        { nome: "Polimento de farol", valor: 50 },
        { nome: "Restauração de farol", valor: 125 }
      ]
    },
    {
      secao: "Motor e metais",
      servicos: [
        { nome: "Polimento de escape inox", valor: 130 },
        {
          nome: "Aplicação de verniz de motor em partes metálicas",
          valor: 30
        },
        { nome: "Clareamento do motor", valor: 80 },
        { nome: "Clareamento de alças", valor: 20 },
        { nome: "Clareamento dos bacalhaus", valor: 20 },
        { nome: "Amenização de ferrugem", valor: 50 }
      ]
    }
  ]
};

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterPreco(servico) {
  if (servico.precos) {
    return servico.precos[campoPorteVeiculo.value] ?? "";
  }

  return servico.valor ?? "";
}

function obterPrecoVitrificadorCarro(duracao) {
  const precos = {
    "2 anos": { Pequeno: 400, Médio: 500, Grande: 600 },
    "5 anos": { Pequeno: 700, Médio: 800, Grande: 900 }
  };

  return precos[duracao]?.[campoPorteVeiculo.value] ?? "";
}

function criarTituloSecao(texto) {
  const titulo = document.createElement("h3");
  titulo.className = "titulo-secao-servicos";
  titulo.textContent = texto;
  listaServicos.appendChild(titulo);
}

function criarCampoValor(nome, valorInicial = "") {
  const campoValor = document.createElement("input");

  campoValor.type = "number";
  campoValor.min = "0";
  campoValor.step = "0.01";
  campoValor.className = "valor-servico";
  campoValor.placeholder = "Valor R$";
  campoValor.setAttribute("aria-label", `Valor de ${nome}`);
  campoValor.value = valorInicial;

  campoValor.addEventListener("input", atualizarOrcamento);
  campoValor.addEventListener("change", atualizarOrcamento);

  return campoValor;
}

function criarSeletorDuracao(servico, id) {
  const seletorDuracao = document.createElement("select");
  seletorDuracao.className = "duracao-vitrificador";
  seletorDuracao.setAttribute(
    "aria-label",
    `Duração da proteção de ${servico.nome}`
  );

  ["2 anos", "5 anos"].forEach(duracao => {
    const opcao = document.createElement("option");
    opcao.value = duracao;
    opcao.textContent = duracao;
    seletorDuracao.appendChild(opcao);
  });

  seletorDuracao.id = `${id}-duracao`;
  return seletorDuracao;
}

function obterPrecoCoating(servico, duracao) {
  if (servico.vitrificadoresMoto) {
    return servico.vitrificadoresMoto[duracao] ?? "";
  }

  if (servico.vitrificadoresCarro) {
    return obterPrecoVitrificadorCarro(duracao);
  }

  return "";
}

function criarLinhaOpcao(servico, id) {
  const linha = document.createElement("div");
  linha.className = "servico-opcao";
  linha.dataset.nome = servico.nome;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "checkbox-opcao-servico";
  checkbox.id = `${id}-opcao-${contadorIds++}`;
  checkbox.setAttribute("aria-label", `Incluir ${servico.nome}`);
  checkbox.addEventListener("change", atualizarOrcamento);

  const label = document.createElement("label");
  label.className = "servico-nome";
  label.htmlFor = checkbox.id;
  label.textContent = servico.nome;

  const campoValor = criarCampoValor(servico.nome, servico.valor ?? "");

  linha.append(checkbox, label, campoValor);
  return linha;
}

function criarLinhaServico(servico, opcoes = {}) {
  const linha = document.createElement("div");
  const id = `servico-${contadorIds++}`;

  linha.className = "servico";
  linha.dataset.nome = servico.nome;
  linha.dataset.personalizado = opcoes.personalizado ? "true" : "false";

  if (opcoes.personalizado) {
    linha.dataset.personalizadoId = servico.id;
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "checkbox-servico";
  checkbox.id = `${id}-checkbox`;
  checkbox.setAttribute("aria-label", `Incluir ${servico.nome}`);
  checkbox.checked = Boolean(opcoes.selecionado);

  const label = document.createElement("label");
  label.className = "servico-nome";
  label.htmlFor = checkbox.id;
  label.textContent = servico.nome;

  linha.append(checkbox, label);

  if (servico.menu) {
    const menu = document.createElement("div");
    menu.className = "opcoes-polimento-motor";
    menu.hidden = !checkbox.checked;

    servico.menu.forEach(item => {
      menu.appendChild(criarLinhaOpcao(item, id));
    });

    checkbox.addEventListener("change", () => {
      menu.hidden = !checkbox.checked;

      if (!checkbox.checked) {
        menu.querySelectorAll(".checkbox-opcao-servico").forEach(item => {
          item.checked = false;
        });
      }

      atualizarOrcamento();
    });

    linha.appendChild(menu);
  } else if (servico.vitrificadoresCarro || servico.vitrificadoresMoto) {
    const seletorDuracao = criarSeletorDuracao(servico, id);
    const campoValor = criarCampoValor(
      servico.nome,
      obterPrecoCoating(servico, seletorDuracao.value)
    );

    seletorDuracao.addEventListener("change", () => {
      campoValor.value = obterPrecoCoating(servico, seletorDuracao.value);
      atualizarOrcamento();
    });

    if (servico.vitrificadoresCarro) {
      campoPorteVeiculo.addEventListener("change", () => {
        campoValor.value = obterPrecoCoating(servico, seletorDuracao.value);
        atualizarOrcamento();
      });
    }

    checkbox.addEventListener("change", atualizarOrcamento);
    linha.append(seletorDuracao, campoValor);
  } else if (servico.opcoes) {
    const listaOpcoes = document.createElement("div");
    listaOpcoes.className = "opcoes-polimento-motor";
    listaOpcoes.hidden = !checkbox.checked;

    servico.opcoes.forEach(opcao => {
      listaOpcoes.appendChild(criarLinhaOpcao(opcao, id));
    });

    checkbox.addEventListener("change", () => {
      listaOpcoes.hidden = !checkbox.checked;

      if (!checkbox.checked) {
        listaOpcoes.querySelectorAll(".checkbox-opcao-servico").forEach(item => {
          item.checked = false;
        });
      }

      atualizarOrcamento();
    });

    linha.appendChild(listaOpcoes);
  } else {
    const campoValor = criarCampoValor(
      servico.nome,
      opcoes.personalizado ? servico.valor || "" : obterPreco(servico)
    );

    linha.appendChild(campoValor);
    checkbox.addEventListener("change", atualizarOrcamento);
  }

  if (servico.categorias && campoPorteVeiculo.value) {
    const categoria = servico.categorias[campoPorteVeiculo.value];

    if (categoria) {
      const detalhe = document.createElement("small");
      detalhe.className = "observacao-servico";
      detalhe.textContent = `Categoria considerada: ${categoria}.`;
      linha.appendChild(detalhe);
    }
  }

  listaServicos.appendChild(linha);
}

function salvarServicosPersonalizadosVisiveis() {
  document
    .querySelectorAll('.servico[data-personalizado="true"]')
    .forEach(linha => {
      const servico = servicosPersonalizados.find(
        item => item.id === linha.dataset.personalizadoId
      );

      if (!servico) return;

      servico.selecionado =
        linha.querySelector(":scope > .checkbox-servico").checked;

      const campoValor = linha.querySelector(":scope > .valor-servico");
      servico.valor = campoValor ? campoValor.value : "";
    });
}

function carregarServicos() {
  salvarServicosPersonalizadosVisiveis();
  listaServicos.replaceChildren();

  const escolha = campoTipoVeiculo.value;
  let tiposParaMostrar = [];

  if (escolha === "Moto" || escolha === "Carro") {
    tiposParaMostrar = [escolha];
  } else if (escolha === "Outro") {
    tiposParaMostrar = ["Moto", "Carro"];
  }

  if (tiposParaMostrar.length === 0) {
    const mensagem = document.createElement("p");
    mensagem.className = "mensagem-inicial";
    mensagem.textContent =
      "Selecione o tipo de veículo para exibir os serviços.";
    listaServicos.appendChild(mensagem);
  } else {
    tiposParaMostrar.forEach(tipo => {
      catalogos[tipo].forEach(secao => {
        const titulo = escolha === "Outro"
          ? `${tipo} — ${secao.secao}`
          : secao.secao;

        criarTituloSecao(titulo);
        secao.servicos.forEach(servico => criarLinhaServico(servico));
      });
    });
  }

  if (servicosPersonalizados.length > 0) {
    criarTituloSecao("Serviços personalizados");

    servicosPersonalizados.forEach(servico => {
      criarLinhaServico(servico, {
        personalizado: true,
        selecionado: servico.selecionado
      });
    });
  }

  atualizarOrcamento();
}

function atualizarOrcamento() {
  document.getElementById("saidaCliente").textContent =
    document.getElementById("cliente").value.trim() || "—";

  document.getElementById("saidaTelefone").textContent =
    document.getElementById("telefoneCliente").value.trim() || "—";

  document.getElementById("saidaTipoVeiculo").textContent =
    campoTipoVeiculo.value || "—";

  document.getElementById("saidaPorteVeiculo").textContent =
    campoPorteVeiculo.value || "—";

  document.getElementById("saidaVeiculo").textContent =
    document.getElementById("veiculo").value.trim() || "—";

  document.getElementById("saidaObservacoes").textContent =
    document.getElementById("observacoes").value.trim() ||
    "Nenhuma observação informada.";

  const tabela = document.getElementById("tabelaServicos");
  tabela.replaceChildren();

  let total = 0;
  let quantidade = 0;

  function adicionarLinhaNaTabela(nome, valor) {
    const linhaTabela = document.createElement("tr");
    const celulaNome = document.createElement("td");
    const celulaValor = document.createElement("td");

    celulaNome.textContent = nome;
    celulaValor.textContent = formatarMoeda(valor);

    linhaTabela.append(celulaNome, celulaValor);
    tabela.appendChild(linhaTabela);

    total += valor;
    quantidade++;
  }

  listaServicos.querySelectorAll(".servico").forEach(linha => {
    const checkbox = linha.querySelector(":scope > .checkbox-servico");
    if (!checkbox) return;

    if (linha.dataset.personalizado === "true") {
      const servico = servicosPersonalizados.find(
        item => item.id === linha.dataset.personalizadoId
      );

      if (servico) {
        servico.selecionado = checkbox.checked;

        const campoValorPersonalizado =
          linha.querySelector(":scope > .valor-servico");

        servico.valor = campoValorPersonalizado
          ? campoValorPersonalizado.value
          : "";
      }
    }

    if (!checkbox.checked) return;

    const menus = linha.querySelectorAll(
      ":scope > .opcoes-polimento-motor"
    );

    if (menus.length > 0) {
      menus.forEach(menu => {
        menu.querySelectorAll(".servico-opcao").forEach(linhaOpcao => {
          const checkboxOpcao =
            linhaOpcao.querySelector(".checkbox-opcao-servico");

          if (!checkboxOpcao || !checkboxOpcao.checked) return;

          const campoValor = linhaOpcao.querySelector(".valor-servico");
          const valor = campoValor ? Number(campoValor.value) || 0 : 0;

          adicionarLinhaNaTabela(linhaOpcao.dataset.nome, valor);
        });
      });

      return;
    }

    const seletorDuracao =
      linha.querySelector(":scope > .duracao-vitrificador");

    const campoValor = linha.querySelector(":scope > .valor-servico");
    const valor = campoValor ? Number(campoValor.value) || 0 : 0;

    if (seletorDuracao) {
      adicionarLinhaNaTabela(
        `${linha.dataset.nome} — ${seletorDuracao.value}`,
        valor
      );
      return;
    }

    adicionarLinhaNaTabela(linha.dataset.nome, valor);
  });

  if (quantidade === 0) {
    const linhaTabela = document.createElement("tr");
    const celula = document.createElement("td");

    celula.colSpan = 2;
    celula.className = "sem-servicos";
    celula.textContent = "Nenhum serviço selecionado.";

    linhaTabela.appendChild(celula);
    tabela.appendChild(linhaTabela);
  }

  document.getElementById("saidaTotal").textContent = formatarMoeda(total);
}

campoTipoVeiculo.addEventListener("change", carregarServicos);
campoPorteVeiculo.addEventListener("change", carregarServicos);

["cliente", "telefoneCliente", "veiculo", "observacoes"].forEach(id => {
  document.getElementById(id).addEventListener("input", atualizarOrcamento);
  document.getElementById(id).addEventListener("change", atualizarOrcamento);
});

document.getElementById("adicionarServico").addEventListener("click", () => {
  const campoNome = document.getElementById("novoServico");
  const campoValor = document.getElementById("novoValor");
  const nome = campoNome.value.trim();

  if (!nome) {
    alert("Digite o nome do serviço que deseja adicionar.");
    campoNome.focus();
    return;
  }

  salvarServicosPersonalizadosVisiveis();

  servicosPersonalizados.push({
    id: `personalizado-${Date.now()}-${contadorIds++}`,
    nome,
    valor: campoValor.value,
    selecionado: true
  });

  campoNome.value = "";
  campoValor.value = "";
  carregarServicos();
});

document.getElementById("gerarPdf").addEventListener("click", () => {
  const algumSelecionado =
    [...document.querySelectorAll(".checkbox-servico")]
      .some(checkbox => checkbox.checked) ||
    [...document.querySelectorAll(".checkbox-opcao-servico")]
      .some(checkbox => checkbox.checked);

  if (!algumSelecionado) {
    alert("Marque pelo menos um serviço antes de gerar o PDF.");
    return;
  }

  const agora = new Date();

  document.getElementById("dataEmissao").textContent =
    agora.toLocaleDateString("pt-BR");

  document.getElementById("numeroOrcamento").textContent =
    `${agora.getFullYear()}` +
    `${String(agora.getMonth() + 1).padStart(2, "0")}` +
    `${String(agora.getDate()).padStart(2, "0")}-` +
    `${String(agora.getHours()).padStart(2, "0")}` +
    `${String(agora.getMinutes()).padStart(2, "0")}` +
    `${String(agora.getSeconds()).padStart(2, "0")}`;

  atualizarOrcamento();
  window.print();
});

document.getElementById("limpar").addEventListener("click", () => {
  const confirmou = confirm(
    "Limpar os dados preenchidos e começar outro orçamento?"
  );

  if (!confirmou) return;

  [
    "cliente",
    "telefoneCliente",
    "tipoVeiculo",
    "porteVeiculo",
    "veiculo",
    "observacoes",
    "novoServico",
    "novoValor"
  ].forEach(id => {
    document.getElementById(id).value = "";
  });

  servicosPersonalizados = [];
  document.getElementById("numeroOrcamento").textContent = "";
  document.getElementById("dataEmissao").textContent = "";

  carregarServicos();
});

carregarServicos();