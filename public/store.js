

// Función para cargar opciones de productos en el select de eliminar productos y de actualizar productos $
function fetchProductOptions() {
    const deleteSelect = document.getElementById('delete-product-select');
    const updateSelect = document.getElementById('product-update-id');
    deleteSelect.innerHTML = ''; // Limpiar opciones anteriores
    updateSelect.innerHTML = '<option value="">Seleccione un producto</option>'; // Limpiar opciones anteriores

    db.collection('products').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = product.name;
            deleteSelect.appendChild(option);
            updateSelect.appendChild(option.cloneNode(true)); // Clonar la opción para usarla en ambos selects
        });
    }).catch((error) => {
        console.error("Error obteniendo productos: ", error);
    });
}

// Función para eliminar un producto
function deleteProduct() {
    const productId = document.getElementById('delete-product-select').value;

    db.collection('products').doc(productId).delete().then(() => {
        console.log("Producto eliminado");
        fetchProductOptions(); // Actualizar opciones de productos después de eliminar
    }).catch((error) => {
        console.error("Error eliminando producto: ", error);
    });
}

// Función para agregar un producto a la tienda
function addProduct() {
    const productName = document.getElementById('product-name').value;
    const productPurchasePrice = parseFloat(document.getElementById('product-purchase-price').value);
    const productUnits = parseInt(document.getElementById('product-units').value);
    const productSalePrice = parseFloat(document.getElementById('product-sale-price').value);
    const productStock = parseInt(document.getElementById('product-stock').value);
    const productDescription = document.getElementById('product-description').value;

    const productCost = productPurchasePrice / productUnits;

    db.collection('products').add({
        name: productName,
        purchasePrice: productPurchasePrice,
        cost: productCost,
        units: productUnits,
        salePrice: productSalePrice,
        stock: productStock,
        description: productDescription
    }).then(() => {
        console.log("Producto añadido");
        // Limpiar campos después de agregar producto
        document.getElementById('product-name').value = '';
        document.getElementById('product-purchase-price').value = '';
        document.getElementById('product-units').value = '';
        document.getElementById('product-sale-price').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-description').value = '';
        // Actualizar lista de productos o opciones según la vista actual
        if (document.getElementById('entry-form').style.display === 'block') {
            fetchProducts(); // Actualizar lista de productos en el formulario de entrada
        } else if (document.getElementById('delete-form').style.display === 'block') {
            fetchProductOptions(); // Actualizar opciones de productos para eliminar
        } else if (document.getElementById('update-form').style.display === 'block') {
            fetchProductOptions(); // Actualizar opciones de productos para actualizar
        }
    }).catch((error) => {
        console.error("Error añadiendo producto: ", error);
    });
}

// Función para obtener y mostrar productos
// Función para obtener y mostrar productos
function fetchProducts() {
    db.collection('products').get().then((querySnapshot) => {
        const productList = document.getElementById('products');
        productList.innerHTML = '';
        let index = 1;
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index++}</td>
                <td>${product.name}</td>
                <td>Q ${product.salePrice}</td>
                <td>${product.stock}</td>
                <td>${product.description}</td>
            `;
            productList.appendChild(row);
        });
    }).catch((error) => {
        console.error("Error obteniendo productos: ", error);
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    fetchProducts();
});



// Función para cargar datos del producto seleccionado para actualizar
function loadProductDataForUpdate() {
    const productId = document.getElementById('product-update-id').value;
    if (!productId) return;

    db.collection('products').doc(productId).get().then((doc) => {
        if (doc.exists) {
            const product = doc.data();
            document.getElementById('product-update-stock').value = product.stock;
            document.getElementById('product-update-price').value = product.salePrice;
            document.getElementById('product-update-description').value = product.description;
        } else {
            console.log("Producto no encontrado");
        }
    }).catch((error) => {
        console.error("Error obteniendo datos del producto: ", error);
    });
}

// Función para actualizar el stock, precio y descripción de un producto
function updateProduct() {
    const productId = document.getElementById('product-update-id').value;
    const newStock = parseInt(document.getElementById('product-update-stock').value);
    const newPrice = parseFloat(document.getElementById('product-update-price').value);
    const newDescription = document.getElementById('product-update-description').value;

    if (!productId || isNaN(newStock) || isNaN(newPrice)) {
        alert('Por favor, complete todos los campos correctamente.');
        return;
    }

    db.collection('products').doc(productId).update({
        stock: newStock,
        salePrice: newPrice,
        description: newDescription
    }).then(() => {
        console.log("Producto actualizado");
        // Limpiar campos después de actualizar producto
        document.getElementById('product-update-id').value = '';
        document.getElementById('product-update-stock').value = '';
        document.getElementById('product-update-price').value = '';
        document.getElementById('product-update-description').value = '';
        // Actualizar lista de productos u opciones según la vista actual
        if (document.getElementById('update-form').style.display === 'block') {
            fetchProducts(); // Actualizar lista de productos en el formulario de actualización
        }
    }).catch((error) => {
        console.error("Error actualizando producto: ", error);
    });
}
document.addEventListener('DOMContentLoaded', (event) => {
      
    fetchProductOptions('edit');
    fetchProductOptions('delete');
    fetchProducts();

});


