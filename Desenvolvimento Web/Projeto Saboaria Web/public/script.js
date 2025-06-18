document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("formPersonalizado");
  const selectEssencia = document.getElementById("essencia");
  const selectCor = document.getElementById("cor");
  const selectForma = document.getElementById("forma");
  const inputQuantidade = document.getElementById("quantidade");
  const precoDisplay = document.getElementById("preco-forma");
  const totalDisplay = document.getElementById("preco-total");

  let precos = {}; // tabela de preços por forma

  // 🔁 Carrega o JSON
  try {
    const response = await fetch("dados.json");
    const dados = await response.json();

    // Popula essências
    dados.essencias.forEach(essencia => {
      const opt = document.createElement("option");
      opt.value = essencia;
      opt.textContent = essencia;
      selectEssencia.appendChild(opt);
    });

    // Popula cores
    dados.cores.forEach(cor => {
      const opt = document.createElement("option");
      opt.value = cor;
      opt.textContent = cor;
      selectCor.appendChild(opt);
    });

    // Popula formas e salva os preços
    dados.formas.forEach(forma => {
      const opt = document.createElement("option");
      opt.value = forma.nome;
      opt.textContent = forma.nome;
      selectForma.appendChild(opt);
      precos[forma.nome] = forma.preco;
    });
  } catch (err) {
    console.error("Erro ao carregar JSON:", err);
    alert("Erro ao carregar os dados do formulário.");
    return;
  }

  function atualizarPrecos() {
    const forma = selectForma.value;
    const quantidade = parseInt(inputQuantidade.value) || 1;

    if (forma && precos[forma]) {
      const precoUnitario = precos[forma];
      const total = precoUnitario * quantidade;

      precoDisplay.textContent = `Preço unitário: R$ ${precoUnitario.toFixed(2).replace(".", ",")}`;
      totalDisplay.textContent = `Total: R$ ${total.toFixed(2).replace(".", ",")}`;
    } else {
      precoDisplay.textContent = "";
      totalDisplay.textContent = "";
    }
  }

  selectForma.addEventListener("change", atualizarPrecos);
  inputQuantidade.addEventListener("input", atualizarPrecos);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const essencia = selectEssencia.value;
    const cor = selectCor.value;
    const forma = selectForma.value;
    const quantidade = parseInt(inputQuantidade.value) || 1;

    if (!essencia || !cor || !forma || quantidade < 1) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const precoUnitario = precos[forma];
    const total = precoUnitario * quantidade;

    const mensagem = `Olá! Gostaria de sabonetes personalizados com:
- Essência: ${essencia}
- Cor: ${cor}
- Forma: ${forma}
- Quantidade: ${quantidade}
- Preço unitário: R$ ${precoUnitario.toFixed(2).replace(".", ",")}
- Total: R$ ${total.toFixed(2).replace(".", ",")}`;

    const numero = "5519993043355";
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
  });

  fetch("produtos.json")
  .then(res => res.json())
  .then(produtos => {
    const container = document.getElementById("lista-produtos");
    produtos.forEach(item => {
      const card = document.createElement("div");
      card.className = "card-produto";

      const img = document.createElement("img");
      img.src = item.imagem;
      img.alt = item.nome;

      const nome = document.createElement("p");
      nome.textContent = item.nome;

      card.appendChild(img);
      card.appendChild(nome);
      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Erro ao carregar produtos:", err);
  });

});

