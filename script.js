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
            img: item.imgUrl || imgDefault, // A foto real que o dono da farmácia subiu (ou padrão)
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
                <a href="https://wa.me/${WA_PHONE}?text=${msg}" target="_blank" style="background:#25D366; color:white; padding:12px 25px; border-radius:30px; text-decoration:none; display:inline-block; margin-top:15px; font-weight:bold;">Perguntar no WhatsApp <i class="fa-brands fa-whatsapp"></i></a>
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
    if (!item) return;
    
    cart.push({ ...item, cartId: Date.now() + Math.random() });
    
    updateUI();            
    refreshProductList();  
    openCart();            
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

function openProductModal(id) {
    const p = database.find(x => x.id === id);
    if (!p) return;

    document.getElementById('modal-p-nome').innerText = p.nome;
    document.getElementById('modal-p-price').innerText = `R$ ${p.price.toFixed(2).replace('.',',')}`;
    document.getElementById('modal-p-desc').innerHTML = p.desc;
    document.getElementById('modal-p-img').innerHTML = `<img src="${p.img}" style="max-width:100%; height:auto;">`;

    const btnAddModal = document.getElementById('modal-add-btn');
    btnAddModal.innerText = "ADICIONAR AO PEDIDO"; 
    
    btnAddModal.onclick = () => {
        addToCart(id);      
        closeProductModal(); 
    };
    
    document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() { document.getElementById('product-modal').style.display = 'none'; }

function changeModalQty(val) { 
    modalQtyCount += val; 
    if(modalQtyCount < 1) modalQtyCount = 1; 
    document.getElementById('modal-qty').innerText = modalQtyCount; 
}

function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

function showAll() {
    currentCategory = "";
    const sobre = document.getElementById('sobre-nos');
    if (sobre) sobre.style.display = 'block';
    
    toggleSpecialSections(true);

    const shop = document.getElementById('shop');
    if (shop) shop.innerHTML = ""; 
    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.value = "";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAllProducts() {
    currentCategory = "";
    const shop = document.getElementById('shop');
    const sobre = document.getElementById('sobre-nos');
    if (sobre) sobre.style.display = 'none';
    
    toggleSpecialSections(false); 

    const searchInput = document.getElementById('searchInput');
    if(searchInput) searchInput.value = "";
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
    const nome = document.getElementById('nome').value.trim();
    const end = document.getElementById('endereco').value.trim(); 
    const num = document.getElementById('numero_end').value.trim();
    const ref = document.getElementById('referencia_end').value.trim();
    const pag = document.getElementById('pagamento').value;
    
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    if (nome === "" || end === "" || num === "" || ref === "") {
        alert("⚠️ Por favor, preencha Nome, Endereço, Número e Referência.");
        return;
    }

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

    let text = `*PEDIDO TOP FARMA*%0A`;
    text += `*Cliente:* ${nome}%0A`;
    text += `*Endereço:* ${end}, Nº ${num}%0A`;
    
    if (ref !== "") {
        text += `*Referência:* ${ref}%0A`;
    }
    
    text += `%0A*ITENS DO PEDIDO:*%0A`;

    cart.forEach(i => {
        text += `- ${i.nome} (R$ ${i.price.toFixed(2).replace('.',',')})%0A`;
    });

    text += `%0A*TOTAL: ${document.getElementById('total-price').innerText}*%0A`;
    text += `*FORMA DE PAGAMENTO:* ${pag}%0A`;

    if (pag === "Dinheiro") {
        const trocoOp = document.querySelector('input[name="troco_op"]:checked')?.value;
        if (trocoOp === "sim") {
            const valorTroco = document.getElementById('valor-troco').value;
            text += `*Troco para:* ${valorTroco}%0A`;
        }
    }

    window.open(`https://wa.me/${WA_PHONE}?text=${text}`);
}

function removeIndividual(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    updateUI();
    refreshProductList();
}

// FUNÇÃO PARA RENDERIZAR O CARROSSEL
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

function inicializarSite() {
    init(); 
    refreshProductList(); 
}

document.addEventListener('DOMContentLoaded', () => {
    // Configura o arrasto dos carrosséis (Touch/Mouse)
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