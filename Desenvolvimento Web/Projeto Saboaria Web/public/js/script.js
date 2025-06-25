// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyDddgBc18vaqwwQc9TBUT1lck9qqKss9N8",
  authDomain: "saboariaweb.firebaseapp.com",
  projectId: "saboariaweb",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// === Utilidades Gerais ===
function abrirModalLogin(e) {
  e.preventDefault();
  const modal = document.getElementById("login-modal");
  modal?.classList.remove("hidden");
}

function carregarAviso() {
  const avisoEl = document.getElementById("texto-aviso");
  if (!avisoEl) return;

  db.collection("config").doc("aviso").get()
    .then(doc => {
      if (doc.exists && doc.data().texto) {
        avisoEl.textContent = doc.data().texto;
      }
    })
    .catch(err => {
      console.error("Erro ao carregar aviso:", err);
    });
}

// === Modal Login ===
document.getElementById("btn-login")?.addEventListener("click", abrirModalLogin);
document.getElementById("login-submit")?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-password").value;
  try {
    await auth.signInWithEmailAndPassword(email, senha);
    alert("Login realizado com sucesso!");
    document.getElementById("login-modal").classList.add("hidden");
  } catch (err) {
    alert("Erro ao fazer login: " + err.message);
  }
});

document.getElementById("criar-conta")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-password").value;
  try {
    await auth.createUserWithEmailAndPassword(email, senha);
    alert("Conta criada com sucesso!");
    document.getElementById("login-modal").classList.add("hidden");
  } catch (err) {
    alert("Erro ao criar conta: " + err.message);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector("#login-modal .close");
  const modal = document.getElementById("login-modal");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }
});

// === Autenticação + Admin ===
auth.onAuthStateChanged(async (user) => {
  const btnLogin = document.getElementById("btn-login");
  const botaoPedido = document.getElementById("enviar-pedido");
  const avisoEl = document.getElementById("texto-aviso");
  const btnEditarAviso = document.getElementById("editar-aviso");

  if (!btnLogin) return;

  if (user) {
    const uid = user.uid;
    try {
      const doc = await db.collection("usuarios").doc(uid).get();
      const dados = doc.data();

      if (doc.exists && dados.role === "admin") {
        console.log("Usuário é administrador!");
        if (!sessionStorage.getItem("saudouAdmin")) {
          alert("Bem-vindo(a), administrador!");
          sessionStorage.setItem("saudouAdmin", "true");
        }

        // Permitir editar aviso
        if (btnEditarAviso) {
          btnEditarAviso.style.display = "inline-block";
          btnEditarAviso.addEventListener("click", async () => {
            const novoTexto = prompt("Digite o novo texto do aviso:", avisoEl.textContent);
            if (novoTexto !== null && novoTexto.trim() !== "") {
              try {
                await db.collection("config").doc("aviso").set({ texto: novoTexto });
                avisoEl.textContent = novoTexto;
                alert("Aviso atualizado com sucesso!");
              } catch (err) {
                console.error("Erro ao atualizar aviso:", err);
                alert("Falha ao atualizar o aviso.");
              }
            }
          });
        }


        // Mostrar painel
        const painel = document.getElementById("painel-admin");
        if (painel) {
          painel.style.display = "block";
          carregarListasAdmin();
        }
      }
    } catch (err) {
      console.error("Erro ao verificar permissoes:", err);
    }

    if (botaoPedido) {
      botaoPedido.disabled = false;
      botaoPedido.style.backgroundColor = "";
      botaoPedido.style.cursor = "pointer";
    }

    btnLogin.textContent = "Minha Conta";
    btnLogin.removeEventListener("click", abrirModalLogin);
    btnLogin.addEventListener("click", () => {
      if (confirm("Deseja sair da conta?")) auth.signOut();
    });

  } else {
    if (botaoPedido) {
      botaoPedido.disabled = true;
      botaoPedido.style.backgroundColor = "#ccc";
      botaoPedido.style.cursor = "not-allowed";
    }
    btnLogin.textContent = "Login";
    btnLogin.removeEventListener("click", abrirModalLogin);
    btnLogin.addEventListener("click", abrirModalLogin);
  }
});

// === Painel Admin ===
async function carregarListasAdmin() {
  const essDoc = await db.collection("personalizacao").doc("essencias").get();
  const coresDoc = await db.collection("personalizacao").doc("cores").get();
  const formasDoc = await db.collection("personalizacao").doc("formas").get();

  const essencias = essDoc.data().valores || [];
  const cores = coresDoc.data().valores || [];
  const formas = formasDoc.data().valores || [];

  renderLista("lista-essencias", essencias, removerEssencia);
  renderLista("lista-cores", cores, removerCor);
  renderLista("lista-formas", formas.map(f => `${f.nome} - R$ ${f.preco.toFixed(2).replace(".", ",")}`), removerForma, formas.map(f => f.nome));
}

function renderLista(id, valores, removerFunc, nomesOriginais) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  valores.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = typeof item === "string" ? item : item;
    const btn = document.createElement("button");
    btn.textContent = "❌";
    btn.style.marginLeft = "10px";
    btn.onclick = () => removerFunc(nomesOriginais ? nomesOriginais[i] : item);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

async function adicionarEssencia() {
  const input = document.getElementById("nova-essencia");
  const nova = input.value.trim();
  if (!nova) return alert("Digite uma essência.");
  const ref = db.collection("personalizacao").doc("essencias");
  const doc = await ref.get();
  const lista = doc.data().valores || [];
  if (lista.includes(nova)) return alert("Essa essência já existe.");
  lista.push(nova);
  await ref.set({ valores: lista });
  input.value = "";
  carregarListasAdmin();
}

async function adicionarCor() {
  const input = document.getElementById("nova-cor");
  const nova = input.value.trim();
  if (!nova) return alert("Digite uma cor.");
  const ref = db.collection("personalizacao").doc("cores");
  const doc = await ref.get();
  const lista = doc.data().valores || [];
  if (lista.includes(nova)) return alert("Essa cor já existe.");
  lista.push(nova);
  await ref.set({ valores: lista });
  input.value = "";
  carregarListasAdmin();
}

async function adicionarForma() {
  const nomeInput = document.getElementById("nova-forma");
  const precoInput = document.getElementById("preco-forma");
  const nome = nomeInput.value.trim();
  const preco = parseFloat(precoInput.value.trim().replace(",", "."));
  if (!nome || isNaN(preco)) return alert("Preencha nome e preço corretamente.");
  const ref = db.collection("personalizacao").doc("formas");
  const doc = await ref.get();
  const lista = doc.data().valores || [];
  if (lista.some(f => f.nome === nome)) return alert("Essa forma já existe.");
  lista.push({ nome, preco });
  await ref.set({ valores: lista });
  nomeInput.value = "";
  precoInput.value = "";
  carregarListasAdmin();
}

async function removerEssencia(nome) {
  if (!confirm(`Deseja remover a essência "${nome}"?`)) return;
  const ref = db.collection("personalizacao").doc("essencias");
  const doc = await ref.get();
  const novaLista = doc.data().valores.filter(e => e !== nome);
  await ref.set({ valores: novaLista });
  carregarListasAdmin();
}

async function removerCor(nome) {
  if (!confirm(`Deseja remover a cor "${nome}"?`)) return;
  const ref = db.collection("personalizacao").doc("cores");
  const doc = await ref.get();
  const novaLista = doc.data().valores.filter(c => c !== nome);
  await ref.set({ valores: novaLista });
  carregarListasAdmin();
}

async function removerForma(nome) {
  if (!confirm(`Deseja remover a forma "${nome}"?`)) return;
  const ref = db.collection("personalizacao").doc("formas");
  const doc = await ref.get();
  const novaLista = doc.data().valores.filter(f => f.nome !== nome);
  await ref.set({ valores: novaLista });
  carregarListasAdmin();
}

// === Página Personalização ===
document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("formPersonalizado");
  const botaoLeitor = document.getElementById("leitor-pagina");

  if (botaoLeitor) {
    botaoLeitor.addEventListener("click", () => {
      const conteudo = document.body.innerText;
      const synth = window.speechSynthesis;
      if (synth.speaking) synth.cancel();
      else {
        const utterance = new SpeechSynthesisUtterance(conteudo);
        utterance.lang = "pt-BR";
        synth.speak(utterance);
      }
    });
  }

  if (!form) return;

  const selectEssencia = document.getElementById("essencia");
  const selectCor = document.getElementById("cor");
  const selectForma = document.getElementById("forma");
  const inputQuantidade = document.getElementById("quantidade");
  const precoDisplay = document.getElementById("preco-forma-texto");
  const totalDisplay = document.getElementById("preco-total");

  let precos = {};

  try {
    const essSnap = await db.collection("personalizacao").doc("essencias").get();
    const corSnap = await db.collection("personalizacao").doc("cores").get();
    const formaSnap = await db.collection("personalizacao").doc("formas").get();

    (essSnap.data().valores || []).forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      selectEssencia.appendChild(o);
    });
    (corSnap.data().valores || []).forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      selectCor.appendChild(o);
    });
    (formaSnap.data().valores || []).forEach(f => {
      const o = document.createElement("option");
      o.value = f.nome;
      o.textContent = f.nome;
      selectForma.appendChild(o);
      precos[f.nome] = f.preco;
    });
  } catch (err) {
    console.error("Erro ao carregar personalização:", err);
    alert("Erro ao carregar os dados do formulário.");
  }

  function atualizarPrecos() {
    const forma = selectForma.value;
    const qtd = parseInt(inputQuantidade.value) || 1;
    if (forma && precos[forma]) {
      const unit = precos[forma];
      const total = unit * qtd;
      precoDisplay.textContent = `Preço unitário: R$ ${unit.toFixed(2).replace(".", ",")}`;
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
    const qtd = parseInt(inputQuantidade.value) || 1;
    if (!essencia || !cor || !forma || qtd < 1) return alert("Preencha todos os campos.");
    const unit = precos[forma];
    const total = unit * qtd;
    const msg = `Olá! Gostaria de sabonetes personalizados com:\n- Essência: ${essencia}\n- Cor: ${cor}\n- Forma: ${forma}\n- Quantidade: ${qtd}\n- Preço unitário: R$ ${unit.toFixed(2).replace(".", ",")}\n- Total: R$ ${total.toFixed(2).replace(".", ",")}`;
    const url = `https://wa.me/5519993043355?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  // Produtos (externos)
  fetch("json/produtos.json")
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
    .catch(err => console.error("Erro ao carregar produtos:", err));

    carregarAviso()
});
