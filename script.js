const WA_PHONE = "5521987911068"; 

const database = [
    { id: 1, cat: 'Remédios', nome: 'Dipirona Sódica 500mg', price: 8.90 },
    { id: 2, cat: 'Remédios', nome: 'Dorflex 36 Comprimidos', price: 19.90 },
    { id: 3, cat: 'Remédios', nome: 'Paracetamol 750mg', price: 11.50 },
    { id: 4, cat: 'Remédios', nome: 'Ibuprofeno 600mg', price: 14.90 },
    { id: 5, cat: 'Remédios', nome: 'Antigripal MultiSint', price: 12.00 },
    { id: 6, cat: 'Remédios', nome: 'Xarope Vick 120ml', price: 26.00 },
    { id: 7, cat: 'Remédios', nome: 'Aspirina 500mg 10un', price: 9.00 },
    { id: 8, cat: 'Cosméticos', nome: 'Protetor Solar FPS 60', price: 59.90 },
    { id: 9, cat: 'Cosméticos', nome: 'Hidratante Neutrogena', price: 39.00 },
    { id: 10, cat: 'Cosméticos', nome: 'Sérum Vitamina C 30ml', price: 79.90 },
    { id: 11, cat: 'Cosméticos', nome: 'Água Micelar 200ml', price: 22.00 },
    { id: 12, cat: 'Cosméticos', nome: 'Gel de Limpeza Facial', price: 34.00 },
    { id: 13, cat: 'Cosméticos', nome: 'Shampoo Antiqueda', price: 42.00 },
    { id: 14, cat: 'Cosméticos', nome: 'Creme Antirrugas Noite', price: 88.00 },
    { id: 15, cat: 'Higiene', nome: 'Sabonete Líquido Protex', price: 12.90 },
    { id: 16, cat: 'Higiene', nome: 'Creme Dental Pack 3un', price: 13.50 },
    { id: 17, cat: 'Higiene', nome: 'Desodorante Rexona Pack', price: 24.00 },
    { id: 18, cat: 'Higiene', nome: 'Fio Dental 50m 2un', price: 9.90 },
    { id: 19, cat: 'Higiene', nome: 'Enxaguante Bucal 500ml', price: 18.00 },
    { id: 20, cat: 'Higiene', nome: 'Papel Higiênico 12un', price: 17.50 },
    { id: 21, cat: 'Higiene', nome: 'Escova de Dente Macia', price: 8.00 },
    { id: 22, cat: 'Vitaminas', nome: 'Vitamina C Efervescente', price: 18.00 },
    { id: 23, cat: 'Vitaminas', nome: 'Multivitamínico A-Z', price: 49.90 },
    { id: 24, cat: 'Vitaminas', nome: 'Ômega 3 1000mg', price: 65.00 },
    { id: 25, cat: 'Vitaminas', nome: 'Colágeno Hidrolisado', price: 82.00 },
    { id: 26, cat: 'Vitaminas', nome: 'Magnésio Dimalato', price: 38.00 },
    { id: 27, cat: 'Vitaminas', nome: 'Vitamina D 2000UI', price: 29.00 },
    { id: 28, cat: 'Vitaminas', nome: 'Biotina Cabelos e Unhas', price: 44.00 }
];

let cart = [];

function init() {
    const shop = document.getElementById('shop');
    const categories = [...new Set(database.map(p => p.cat))];
    let html = "";

    categories.forEach(cat => {
        const products = database.filter(p => p.cat === cat);
        html += `
            <div class="category-section">
                <div class="category-header">
                    <h2 class="category-title">${cat}</h2>
                    <span class="drag-hint">Arraste para o lado ➔</span>
                </div>
                <div class="product-row">
                    ${products.map(p => `
                        <div class="product-card" data-name="${p.nome.toLowerCase()}">
                            <div class="img-placeholder"></div>
                            <p class="prod-name">${p.nome}</p>
                            <span class="price-now">R$ ${p.price.toFixed(2)}</span>
                            <div class="product-controls">
                                <button class="btn-add" onclick="addToCart(${p.id}, this)">ADICIONAR +</button>
                                <span id="qtd-${p.id}" class="qtd-badge">0</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    });
    shop.innerHTML = html;
}

function addToCart(id, btn) {
    const item = database.find(p => p.id === id);
    const inCart = cart.find(p => p.id === id);
    if (inCart) { inCart.qtd++; } else { cart.push({...item, qtd: 1}); }

    const badge = document.getElementById(`qtd-${id}`);
    const currentItem = cart.find(p => p.id === id);
    badge.innerText = currentItem.qtd + "x";
    badge.style.display = "block";

    btn.innerText = "ADICIONADO";
    setTimeout(() => { btn.innerText = "ADICIONAR +"; }, 600);
    updateUI();
}

function updateUI() {
    const totalCount = cart.reduce((a, b) => a + b.qtd, 0);
    const totalPrice = cart.reduce((a, b) => a + (b.price * b.qtd), 0);
    document.getElementById('cart-count').innerText = totalCount;
    document.getElementById('total-price').innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
    
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.map(i => `
        <div class="cart-item">
            <div class="cart-item-info">
                <strong>${i.nome}</strong><br>
                <small>${i.qtd}x R$ ${i.price.toFixed(2)}</small>
            </div>
            <button class="btn-remove-item" onclick="remove(${i.id})">Remover</button>
        </div>
    `).join('');
}

function remove(id) {
    cart = cart.filter(i => i.id !== id);
    const badge = document.getElementById(`qtd-${id}`);
    if(badge) { badge.innerText = "0"; badge.style.display = "none"; }
    updateUI();
}

function filterProducts() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    const sections = document.querySelectorAll('.category-section');
    let encontrou = false;

    cards.forEach(card => {
        const nome = card.getAttribute('data-name');
        if (nome.includes(term)) { card.style.display = 'flex'; encontrou = true; } 
        else { card.style.display = 'none'; }
    });

    sections.forEach(sec => {
        const hasVisible = Array.from(sec.querySelectorAll('.product-card')).some(c => c.style.display === 'flex');
        sec.style.display = hasVisible ? 'block' : 'none';
    });

    const shop = document.getElementById('shop');
    let msgErro = document.getElementById('msg-erro-busca');
    if (!encontrou && term !== "") {
        if (!msgErro) {
            msgErro = document.createElement('div');
            msgErro.id = 'msg-erro-busca';
            msgErro.style.cssText = "text-align:center; padding:30px; color:#555;";
            shop.appendChild(msgErro);
        }
        msgErro.innerHTML = `<p><strong>Não tem promoção para esse produto.</strong></p><p>Mande uma mensagem para a loja e procure o valor!</p><br><a href="https://wa.me/${WA_PHONE}?text=Olá, não achei '${term}'" style="background:var(--accent); color:white; padding:10px 20px; border-radius:30px; text-decoration:none; font-weight:bold;">Chamar no WhatsApp</a>`;
    } else if (msgErro) { msgErro.remove(); }
}

function openCart() { document.getElementById('cart-modal').style.display = 'flex'; }
function closeCart() { document.getElementById('cart-modal').style.display = 'none'; }

// LÓGICA DO TROCO
function toggleTroco() {
    const metodo = document.getElementById('pagamento').value;
    const campoTroco = document.getElementById('troco-container');
    campoTroco.style.display = (metodo === 'Dinheiro') ? 'block' : 'none';
}

function sendWhatsApp() {
    const nome = document.getElementById('nome').value;
    const end = document.getElementById('endereco').value;
    const pag = document.getElementById('pagamento').value;
    const troco = document.getElementById('valor-troco').value;

    if (!nome || !end) return alert("Preencha nome e endereço!");
    if (cart.length === 0) return alert("Seu carrinho está vazio!");

    let text = `*PEDIDO FARMAPRO*%0A%0A`;
    text += `*Cliente:* ${nome}%0A`;
    text += `*Endereço:* ${end}%0A`;
    text += `*Pagamento:* ${pag}%0A`;
    
    if (pag === 'Dinheiro' && troco) {
        text += `*Troco para:* R$ ${troco}%0A`;
    }

    text += `%0A*ITENS:*%0A`;
    cart.forEach(i => text += `- ${i.qtd}x ${i.nome}%0A`);
    text += `%0A*TOTAL: ${document.getElementById('total-price').innerText}*`;

    window.open(`https://wa.me/${WA_PHONE}?text=${text}`);
}

document.addEventListener('DOMContentLoaded', init);