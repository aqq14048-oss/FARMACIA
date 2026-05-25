const WA_PHONE = "5521968603869"; 
const imgDefault = "https://cdn-icons-png.flaticon.com/512/3028/3028549.png";

// Conexão com o seu painel do Sanity
const SANITY_PROJECT_ID = "s51oubjx"; 
const DATASET = "production";

// Busca os produtos e a URL da foto na nuvem
const QUERY = encodeURIComponent('*[_type == "produto"]{idNumerico, nome, cat, price, priceOld, desc, "imgUrl": img.asset->url}');
const URL_API = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=${QUERY}`;

// Arrays vazios que serão preenchidos pela nuvem
let database = [];
let maisVendidosDB = [];
let superOfertasDB = [];

async function carregarProdutosDoSanity() {
    try {
        const resposta = await fetch(URL_API);
        const dados = await resposta.json();
        
        // Converte os dados do painel para o formato que o seu site já entende
        database = dados.result.map(item => ({
            id: item.idNumerico, 
            cat: item.cat, 
            nome: item.nome,
            price: item.price, 
            img: item.imgUrl, // A foto real que o dono da farmácia subiu
            priceOld: item.priceOld || "",
            desc: item.desc || ""
        }));

        // Separa os carrosséis
        maisVendidosDB = database.filter(p => p.cat === 'Destaque');
        superOfertasDB = database.filter(p => p.cat === 'Oferta');

        // Dá a partida no site
        inicializarSite(); 
        refreshProductList();

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        const shop = document.getElementById('shop');
        if(shop) shop.innerHTML = "<p style='text-align:center; padding: 20px;'>Erro ao carregar a vitrine. Tente novamente.</p>";
    }
}

// Inicia a busca automática
carregarProdutosDoSanity();


let cart = [];
let modalQtyCount = 0;
let currentCategory = ""; 

function init() {
    const shop = document.getElementById('shop');
    if (shop) shop.innerHTML = ""; 

    const trocoInput = document.getElementById('valor-troco');
    if(trocoInput) {
        trocoInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, "");
            if (value === "") { e.target.value = ""; return; }
            value = (value / 100).toFixed(2).replace(".", ",");
            e.target.value = "R$ " + value;
        });
    }
}

// REDESENHA A VITRINE PARA ATUALIZAR OS BOTÕES +/-
function refreshProductList() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // 1. ATUALIZA O CONTADOR DA PROMOÇÃO (FINETOSS ID 777)
    const promoBtnContainer = document.getElementById('cart-ctrl-promo');
    if (promoBtnContainer) {
        promoBtnContainer.innerHTML = getCartControlHTML(777); 
    }

    // 2. ATUALIZA OS CARROSSEIS
    renderCarrossel('mais-vendidos', maisVendidosDB);
    renderCarrossel('super-ofertas', superOfertasDB);

    // 3. ATUALIZA A VITRINE PRINCIPAL
    if (searchTerm !== "") {
        filterProducts();
    } else if (currentCategory !== "") {
        // CORREÇÃO: Usar currentCategory em vez de categoryName
        const products = database.filter(p => p.cat.toLowerCase() === currentCategory.toLowerCase()); 
        renderProducts(products, currentCategory);
    }
}

// Função para mostrar ou esconder as seções de carrossel
function toggleSpecialSections(show) {
    const sections = document.querySelector('.special-sections');
    if (sections) {
        sections.style.display = show ? 'block' : 'none';
    }
}

// ATUALIZADA: Esconde carrossel ao filtrar por categoria (os círculos)
function filterByCategory(categoryName) {
    currentCategory = categoryName;
    const shop = document.getElementById('shop');
    const sobre = document.getElementById('sobre-nos');
    if (sobre) sobre.style.display = 'none';

    // ESCONDE AS FILEIRAS (Carrosséis)
    toggleSpecialSections(false);

    const products = database.filter(p => p.cat.toLowerCase() === categoryName.toLowerCase());
    renderProducts(products, categoryName);
    window.scrollTo({ top: shop.offsetTop - 100, behavior: 'smooth' });
}

// ATUALIZADA: Esconde carrossel ao buscar
window.filterProducts = function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sobre = document.getElementById('sobre-nos');
    const shop = document.getElementById('shop');

    if (searchTerm !== "") {
        if (sobre) sobre.style.display = 'none';
        toggleSpecialSections(false); // ESCONDE
    } else {
        if (currentCategory === "" && sobre) {
            sobre.style.display = 'block';
            toggleSpecialSections(true); // MOSTRA SE ESTIVER NA HOME
        }
    }
    
    if (searchTerm === "") {
        if (currentCategory) { 
            filterByCategory(currentCategory); 
        } else { 
            shop.innerHTML = ""; 
        }
        return;
    }

    let results = currentCategory === "" 
        ? database.filter(p => p.nome.toLowerCase().includes(searchTerm))
        : database.filter(p => p.cat.toLowerCase() === currentCategory.toLowerCase() && p.nome.toLowerCase().includes(searchTerm));

    if (results.length > 0) {
        renderProducts(results, currentCategory ? `Em ${currentCategory}` : "Resultados");
    } else {
       const msg = encodeURIComponent(`Olá! Não encontrei "${searchTerm}" no site. Tem disponível?`);
        shop.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p>Não temos promoção para este item.</p>
                <a href="https://wa.me/$5521968603869?text=${msg}" target="_blank" style="background:#25D366; color:white; padding:12px 25px; border-radius:30px; text-decoration:none; display:inline-block; margin-top:15px; font-weight:bold;">Perguntar no WhatsApp <i class="fa-brands fa-whatsapp"></i></a>
            </div>`;
    }
};
function renderProducts(products, title) {
    const shop = document.getElementById('shop');
    const headerHtml = title ? `<h2 class="category-title">${title}</h2>` : "";

    shop.innerHTML = `
        <div class="category-section">
            ${headerHtml}
            <div class="product-row">
                ${products.map(p => {
                    // Verifica se existe priceOld, se não existir deixa vazio
                    const fraseOuPrecoAntigo = p.priceOld ? `<span class="price-old">${p.priceOld}</span>` : "";
                    
                    return `
                    <div class="product-card" onclick="openProductModal(${p.id})">
                        <div class="img-placeholder"><img src="${p.img}"></div>
                        <p class="prod-name">${p.nome}</p>
                        ${fraseOuPrecoAntigo} <span class="price-now">R$ ${p.price.toFixed(2).replace('.',',')}</span>
                        <div id="cart-ctrl-${p.id}">
                            ${getCartControlHTML(p.id)}
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>`;
}

function getCartControlHTML(productId) {
    const quantity = cart.filter(item => item.id === productId).length;
    if (quantity > 0) {
        return `
            <div class="quantity-control-card">
                <button class="qty-btn-card" onclick="event.stopPropagation(); removeFromCart(${productId})">-</button>
                <span class="qty-num-card">${quantity}</span>
                <button class="qty-btn-card" onclick="event.stopPropagation(); addToCart(${productId})">+</button>
            </div>`;
    } else {
        return `<button class="btn-add" onclick="event.stopPropagation(); addToCart(${productId})">ADICIONAR +</button>`;
    }
}

function addToCart(id) {
    const item = database.find(p => p.id === id);
    
    // Adiciona 1 item ao array
    cart.push({ ...item, cartId: Date.now() + Math.random() });
    
    updateUI();            // Atualiza balãozinho e modal do carrinho
    refreshProductList();  // Atualiza o contador de fora (+ 1 -)
    openCart();            // Abre o carrinho como você pediu
}
function removeFromCart(id) {
    const index = cart.findIndex(item => item.id === id);
    if (index > -1) {
        cart.splice(index, 1);
    }
    updateUI();
    refreshProductList();
}

function updateUI() {
    const total = cart.reduce((a, b) => a + b.price, 0);
    const cartCountElement = document.getElementById('cart-count');
    
    if (cartCountElement) {
        cartCountElement.innerText = cart.length;
        cartCountElement.style.display = cart.length > 0 ? 'flex' : 'none';
    }

    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        totalPriceElement.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#718096;">Seu carrinho está vazio.</p>';
        } else {
            // RENDERIZAÇÃO INDIVIDUAL: Cada item do array vira uma linha
            cartItemsContainer.innerHTML = cart.map(i => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #eee;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <img src="${i.img}" style="width:40px; height:40px; object-fit:contain;">
                        <div>
                            <strong style="font-size:14px;">${i.nome}</strong><br>
                            <small style="color:var(--primary); font-weight:bold;">R$ ${i.price.toFixed(2).replace('.',',')}</small>
                        </div>
                    </div>
                    <button onclick="removeIndividual(${i.cartId})" style="color:#ff4d4d; border:none; background:none; font-size:18px; cursor:pointer;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`).join('');
        }
    }
}

function removeTodosDoId(id) {
    cart = cart.filter(i => i.id !== id);
    updateUI();
    refreshProductList();
}

// Funções de Modal e UI permanecem
function openProductModal(id) {
    const p = database.find(x => x.id === id);

    document.getElementById('modal-p-nome').innerText = p.nome;
    document.getElementById('modal-p-price').innerText = `R$ ${p.price.toFixed(2).replace('.',',')}`;
    document.getElementById('modal-p-desc').innerHTML = p.desc;
    document.getElementById('modal-p-img').innerHTML = `<img src="${p.img}" style="max-width:100%; height:auto;">`;

    // CONFIGURAÇÃO DO BOTÃO DE ADICIONAR DENTRO DO MODAL
    const btnAddModal = document.getElementById('modal-add-btn');
    btnAddModal.innerText = "ADICIONAR AO PEDIDO"; // Texto padrão
    
    btnAddModal.onclick = () => {
        addToCart(id);      // Chama a função que já temos para adicionar
        closeProductModal(); // Fecha o modal após adicionar
    };
    
    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() { document.getElementById('product-modal').style.display = 'none'; }
function changeModalQty(val) { 
    modalQtyCount += val; 
    
    // Impede que a quantidade seja menor que 1 no modal
    if(modalQtyCount < 1) modalQtyCount = 1; 
    
    document.getElementById('modal-qty').innerText = modalQtyCount; 
}

function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }
// ATUALIZADA: Mostra o carrossel ao voltar para a Home
function showAll() {
    currentCategory = "";
    const sobre = document.getElementById('sobre-nos');
    if (sobre) sobre.style.display = 'block';
    
    // MOSTRA AS FILEIRAS NOVAMENTE
    toggleSpecialSections(true);

    document.getElementById('shop').innerHTML = ""; 
    document.getElementById('searchInput').value = "";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ATUALIZADA: Esconde carrossel ao mostrar "Todos os produtos"
function showAllProducts() {
    currentCategory = "";
    const shop = document.getElementById('shop');
    const sobre = document.getElementById('sobre-nos');
    if (sobre) sobre.style.display = 'none';
    
    toggleSpecialSections(false); // ESCONDE

    document.getElementById('searchInput').value = "";
    renderProducts(database, "Todos os Produtos");
    window.scrollTo({ top: shop.offsetTop - 100, behavior: 'smooth' });
}
function toggleTroco() { 
    document.getElementById('troco-pergunta').style.display = (document.getElementById('pagamento').value === 'Dinheiro') ? 'block' : 'none'; 
}

function handleTrocoVisibility() {
    const choice = document.querySelector('input[name="troco_op"]:checked')?.value;
    document.getElementById('troco-container').style.display = (choice === 'sim') ? 'block' : 'none';
}

function sendWhatsApp() {
   
    // 1. Pegar os valores dos campos
    const nome = document.getElementById('nome').value.trim();
    const end = document.getElementById('endereco').value.trim(); // ID correto é 'endereco'
    const num = document.getElementById('numero_end').value.trim();
    const ref = document.getElementById('referencia_end').value.trim();
    const pag = document.getElementById('pagamento').value;
    
    // 2. Validação: Verifica se os campos obrigatórios estão vazios
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    if (nome === "" || end === "" || num === "" || ref === "") {
        alert("⚠️ Por favor, preencha Nome, Endereço, Número e Referência.");
        return;
    }

    // 3. Lógica do Troco (Verifica se escolheu Dinheiro e se precisa de troco)
    let trocoTexto = "";
    if (pag === "Dinheiro") {
        const trocoOp = document.querySelector('input[name="troco_op"]:checked')?.value;
        const valorTroco = document.getElementById('valor-troco').value.trim();
        
        if (trocoOp === "sim") {
            if (valorTroco === "") {
                alert("⚠️ Por favor, informe o valor para o troco.");
                return;
            }
            trocoTexto = `%0A*Troco para:* ${valorTroco}`;
        }
    }
    // Cabeçalho da mensagem
    let text = `*PEDIDO TOP FARMA*%0A`;
    text += `*Cliente:* ${nome}%0A`;
    text += `*Endereço:* ${end}, Nº ${num}%0A`;
    
    // Adiciona referência se estiver preenchida
    if (ref !== "") {
        text += `*Referência:* ${ref}%0A`;
    }
    
    text += `%0A*ITENS DO PEDIDO:*%0A`;

    // Lista os itens um por um (como você pediu antes)
    cart.forEach(i => {
        text += `- ${i.nome} (R$ ${i.price.toFixed(2).replace('.',',')})%0A`;
    });

    text += `%0A*TOTAL: ${document.getElementById('total-price').innerText}*%0A`;
    text += `*FORMA DE PAGAMENTO:* ${pag}%0A`;

    // Lógica do troco
    if (pag === "Dinheiro") {
        const trocoOp = document.querySelector('input[name="troco_op"]:checked')?.value;
        if (trocoOp === "sim") {
            const valorTroco = document.getElementById('valor-troco').value;
            text += `*Troco para:* ${valorTroco}%0A`;
        }
    }

    // Abre o WhatsApp com a mensagem formatada
    window.open(`https://wa.me/${WA_PHONE}?text=${text}`);
}

function removeIndividual(cartId) {
    // Filtra o carrinho mantendo todos os itens, exceto o que tem esse cartId específico
    cart = cart.filter(item => item.cartId !== cartId);
    
    updateUI();
    refreshProductList();
}
// --- NOVAS SEÇÕES (MAIS VENDIDOS E SUPER OFERTAS) ---

const maisVendidosDB = [
    { id: 901, cat: 'Destaque', nome: 'Expec Xarope 120 mL', price: 34.99, priceOld: 'Medicamento: leia as advertências na descrição.', img: 'image/expec.jfif', desc: 'Expec Xarope (Legrand); Indicação: Tratamento sintomático da tosse (irritativa, não produtiva) e fluidificante da secreção brônquica; Apresentação: Frasco com 120mL + copo medida; Uso: Adulto e Pediátrico acima de 2 anos; Via: Oral; Registro MS:1.6773.0271; Fabricado por: Legrand Pharma Indústria Farmacêutica Ltda; SAC: 0800 050 0600; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO. <br><br> <a href="pdf/bula_paciente_expec.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>' },
    { id: 903, cat: 'Destaque', nome: 'Fralda Geriátrica Geriatex M/G/EG ', price: 23.99, priceOld: 'por apenas:', img: 'image/geriatex.png', desc: 'Fralda Geriátrica Geriatex Fralda descartável unissex para incontinência moderada a intensa. Destaques: Alta absorção, barreiras antivazamento e fitas ajustáveis. Conforto: Formato anatômico com controle de odor. Tamanho:M,G,EG Quantidade: M-9, G-7, EG- 7 unidades. Uso adulto. Descartável e hipoalergênica.' },
    { id: 904, cat: 'Destaque', nome: 'Nevralgex 3 Cartelas', price: 12.99, priceOld: 'Medicamento: leia as advertências na descrição.', img: 'image/nevralgex.webp', desc: 'Nevralgex (Cimed); Composição: Dipirona monoidratada, citrato de orfenadrina e cafeína anidra; Apresentação: Embalagem com 30 comprimidos (3 cartelas de 10); Uso: Adulto; Via: Oral; Indicação: Analgésico e relaxante muscular; Registro MS: 1.4381.0051; Fabricado por: Cimed Indústria de Medicamentos Ltda; SAC: 0800 704 4647; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO. <br><br> <a href="pdf/bula_paciente_nevralgex.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>'},
    { id: 905, cat: 'Destaque', nome: 'Dorflex 3 CARTELAS c/10 comprimidos', price: 8.95, priceOld: 'Medicamento: leia as advertências na descrição.', img: 'image/dorflex.webp', desc: 'Dorflex (Sanofi); Composição: Dipirona monoidratada, citrato de orfenadrina e cafeína anidra; Apresentação: Embalagem com 30 comprimidos (3 cartelas de 10); Uso: Adulto; Via: Oral; Indicação: Alívio de dores associadas a contraturas musculares e cefaleia tensional; Registro MS:1.8620.0008 ; Fabricado por: Sanofi Medley Farmacêutica Ltda; SAC: 0800 703 0033; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.<br><br> <a href="pdf/bula_paciente_dorflex.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>'},
     { id: 906, cat: 'Destaque', nome: 'Dipirona prati 500mg 3 cartelas', price: 9.99, priceOld: 'Medicamento GENÉRICO: leia as advertências na descrição.', img: 'image/dipirona.webp', desc: 'Dipirona Monoidratada Prati-Donaduzzi; Apresentação: Caixa com 30 comprimidos (3 cartelas de 10); Uso: Adulto e pediátrico; Via: Oral; Indicação: Analgésico e antitérmico; Registro MS:1.2568.0040; Fabricado por: Prati, Donaduzzi & Cia Ltda; SAC: 0800 709 9333; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO. <br><br> <a href="pdf/bula_paciente_dipirona.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>'},
     { id: 907, cat: 'Destaque', nome: 'ibuprofeno gotas geolab 100mg/ml Tutti Frutti', price: 14.99, priceOld: 'Medicamento GENÉRICO: leia as advertências na descrição.', img: 'image/ibuprofeno.jpeg', desc: ' Ibuprofeno Geolab 100mg/mL; Sabor: Tutti-Frutti; Apresentação: Suspensão oral em gotas (frasco 20mL); Uso: Adulto e pediátrico; Indicação: Antitérmico e analgésico; Registro MS:1.5423.0133 ; Fabricado por: Geolab Indústria Farmacêutica S/A; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.<br><br> <a href="pdf/bula_paciente_ibuprofeno.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>'},
     { id: 908, cat: 'Destaque', nome: 'babymed pomada de assadura rosa ou azul', price: 9.99, priceOld: 'por apenas:', img: 'image/babymed.jfif', desc: 'Babymed (Cimed) Azul e Rosa; Indicação: Prevenção e tratamento de assaduras; Apresentação: Bisnaga; Uso: Infantil e Adulto; Registro MS: Consulte na Embalagem; Fabricado por: Cimed Indústria de Medicamentos Ltda; SAC: 0800 704 4647; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.' },
     { id: 909, cat: 'Destaque', nome: 'Creme skala potão 1kg ', price: 10.99, priceOld: 'por apenas:', img: 'image/skala.jfif', desc: 'Creme de Tratamento Skala 1kg (Todos os tipos); Indicação: Hidratação, Nutrição ou Reconstrução Capilar; Apresentação: Pote 1kg; Uso: Externo; Processo ANVISA nº: Consulte na Embalagem; Fabricado por: Skala Cosméticos; MANTENHA FORA DO ALCANCE DE CRIANÇAS; EM CASO DE IRRITAÇÃO, SUSPENDA O USO.' },
      { id: 910, cat: 'Destaque', nome: 'Vitergyl 1g(Vitamina C) c/10', price: 9.99, priceOld: 'Medicamento: leia as advertências na descrição.', img: 'image/vitergyl.webp', desc: 'Vitergyl C (cifarma); Indicação: Suplemento vitamínico auxiliar no sistema imunológico e em estados de deficiência de Vitamina C; Apresentação: Comprimidos efervescentes; Uso: Adulto e Pediátrico; Via: Oral; Registro MS: 1.1560.0192 ; Fabricado por: Legrand Pharma Indústria Farmacêutica Ltda; SAC: 0800 050 0600; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.<br><br> <a href="pdf/bula_paciente_vitergyl.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>' },
      { id: 911, cat: 'Destaque', nome: 'Resfegripe c/20', price: 12.99, priceOld: 'Medicamento: leia as advertências na descrição.', img: 'image/resfegripe.webp', desc: 'Resfegripe (Multilab); Indicação: Alívio dos sintomas de gripes e resfriados, como febre, dor e congestão nasal; Composição: Paracetamol, maleato de clorfeniramina e cloridrato de fenilefrina; Apresentação: Cápsulas; Uso: Adulto; Via: Oral; Registro MS:1.1819.0269; Fabricado por: Multilab Indústria e Comércio de Produtos Farmacêuticos Ltda; SAC: 0800 600 0660; SE PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.<br><br> <a href="pdf/bula_paciente_resfegripe.pdf" target="_blank" style="color: #0000FE; font-weight: bold; text-decoration: underline;">📄 Ver Bula Completa (PDF)</a>' },
     { id: 912, cat: 'Destaque', nome: 'Creme Novex potão 1kg ', price: 24.99, priceOld: 'por apenas:', img: 'image/novex.jfif', desc: 'Creme de Tratamento Novex 1kg (Embelleze); Indicação: Hidratação profunda, nutrição ou reconstrução capilar (conforme variante); Apresentação: Pote 1kg; Uso: Externo (Capilar); Processo ANVISA nº: Consulte na Embalagem; Fabricado por: Embelleze (Itajubá Fabril Ltda); SAC: 0800 881 2667; Conservar em local fresco e ao abrigo da luz solar; MANTENHA FORA DO ALCANCE DE CRIANÇAS; EM CASO DE IRRITAÇÃO, SUSPENDA O USO.' },
      { id: 913, cat: 'Destaque', nome: 'Creme De Tratamento keraform 1kg ', price: 19.99, priceOld: 'por apenas:', img: 'image/keraform.jfif', desc: 'Creme de Tratamento Keraform 1kg (Skafe); Indicação: Tratamento intensivo conforme a necessidade do fio (hidratação/nutrição); Apresentação: Pote 1kg; Uso: Externo; Processo ANVISA nº: Consulte na Embalagem; Fabricado por: Skafe Cosméticos; SAC: 0800 709 8163; Conservar em local seco e fresco; MANTENHA FORA DO ALCANCE DE CRIANÇAS; EM CASO DE IRRITAÇÃO, SUSPENDA O USO.' },
      { id: 914, cat: 'Destaque', nome: 'Creme kanechom 1kg ', price: 9.99, priceOld: 'por apenas:', img: 'image/kanechom.jfif', desc: 'Creme Capilar Kanechom 1kg; Indicação: Condicionamento e tratamento capilar; Apresentação: Pote 1kg; Uso: Externo; Processo ANVISA nº: Consulte na Embalagem; Fabricado por: Kanechom (Indústrias de Cosméticos Kanechom Ltda); SAC: 0800 709 7771; Conservar em local fresco; MANTENHA FORA DO ALCANCE DE CRIANÇAS; EM CASO DE IRRITAÇÃO, SUSPENDA O USO.' },
      { id: 915, cat: 'Destaque', nome: 'Papel Higienico deluxe c/12 ', price: 9.99, priceOld: 'por apenas:', img: 'image/deluxe.webp', desc: 'Papel Higiênico Deluxe (Folha Dupla/Tripla); Apresentação: Pacote com 12 rolos; Características: Alta absorção e maciez; Composição: Fibras celulósicas naturais;  Prazo de Validade: Indeterminado, desde que mantido em local seco e arejado.' }


];

const superOfertasDB = [
    { id: 801, cat: 'Oferta', nome: 'Fralda G 40 Unid', price: 38.00, priceOld: 59.90, img: imgDefault, desc: 'Fralda descartável com alta absorção e barreiras antivazamento.' },
    { id: 802, cat: 'Oferta', nome: 'Shampoo Anticaspa', price: 14.50, priceOld: 22.90, img: imgDefault, desc: 'Limpeza profunda do couro cabeludo com ação refrescante.' },
    { id: 803, cat: 'Oferta', nome: 'Desodorante Aerosol', price: 9.90, priceOld: 16.00, img: imgDefault, desc: 'Proteção 48h contra o odor e transpiração.' },
    { id: 804, cat: 'Oferta', nome: 'Gel de Limpeza Facial', price: 27.50, priceOld: 45.00, img: imgDefault, desc: 'Remove a oleosidade sem agredir a barreira natural da pele.' }
];

// Garante que os produtos novos existam no banco de dados para as funções originais funcionarem
[...maisVendidosDB, ...superOfertasDB].forEach(p => {
    if (!database.find(x => x.id === p.id)) {
        database.push(p);
    }
});

// FUNÇÃO PARA RENDERIZAR O CARROSSEL (Agora usando seu padrão de botões)
function renderCarrossel(idContainer, listaProdutos) {
    const container = document.getElementById(idContainer);
    if (!container) return;

    container.innerHTML = listaProdutos.map(p => `
        <div class="card-carrossel" onclick="openProductModal(${p.id})">
            <img src="${p.img}" alt="${p.nome}">
            <div>
                <h3>${p.nome}</h3>
               <p class="price-old">${p.priceOld}</p>
                <p class="price-new">R$ ${p.price.toFixed(2).replace('.',',')}</p>
            </div>
            <div id="cart-ctrl-home-${p.id}">
                ${getCartControlHTML(p.id)}
            </div>
        </div>
    `).join('');
}

// ATUALIZADA: Para o contador mudar na Home em tempo real

// Inicializar e configurar arraste
// Função para garantir que tudo carregue ao abrir o site
function inicializarSite() {
    init(); 
    refreshProductList(); 
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do conteúdo
    
    
    // Renderiza carrosséis específicos se as funções existirem
    if (typeof renderCarrossel === 'function') {
        renderCarrossel('mais-vendidos', maisVendidosDB);
        renderCarrossel('super-ofertas', superOfertasDB);
    }

    // Configura o arrasto dos carrosséis (Touch/Mouse) - Bloco Único
    const tracks = document.querySelectorAll('.carousel-track');
    tracks.forEach(track => {
        let isDown = false; let startX; let scrollLeft;
        track.addEventListener('mousedown', (e) => { 
            isDown = true; 
            startX = e.pageX - track.offsetLeft; 
            scrollLeft = track.scrollLeft; 
        });
        track.addEventListener('mouseleave', () => isDown = false);
        track.addEventListener('mouseup', () => isDown = false);
        track.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 2;
            track.scrollLeft = scrollLeft - walk;
        });
    });

    // Lógica para esconder o banner promocional ao pesquisar
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const bannerPrincipal = document.querySelector('.promo-banner-container');
            if (this.value.trim().length > 0) {
                if (bannerPrincipal) bannerPrincipal.style.display = 'none';
            } else {
                if (bannerPrincipal) bannerPrincipal.style.display = 'flex';
            }
        });
    }
});

// Funções de controle do Zoom (Necessário para o Mural e Imagens)
function openZoom(src) {
    const modal = document.getElementById("zoomModal");
    const img = document.getElementById("imgZoomed");
    if(modal && img) {
        modal.style.display = "flex";
        img.src = src;
        document.body.style.overflow = "hidden";
    }
}

function closeZoom() {
    const modal = document.getElementById("zoomModal");
    if(modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}