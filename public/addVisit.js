document.addEventListener('DOMContentLoaded', function() {
    loadClientOptionsForVisit();
    setTodayDateFilter(); // Inicializa el filtro de fecha con la fecha actual
    loadVisits(); // Carga las visitas para la fecha actual
    loadProductOptions(); // Cargar opciones de productos al inicio
});

// Cargar opciones de clientes para el select
function loadClientOptionsForVisit() {
    db.collection('clients').orderBy('name').get().then((querySnapshot) => {
        const clientSelect = document.getElementById('visit-client-select');
        clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>'; // Limpiar opciones anteriores

        querySnapshot.forEach((doc) => {
            const client = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${client.name} (${client.alias})`;
            clientSelect.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error obteniendo opciones de clientes: ", error);
    });
}

function registerVisit() {
    const clientId = document.getElementById('visit-client-select').value;
    const clientName = document.getElementById('visit-client-name').value;

    if (!clientId) {
        alert('Por favor, seleccione un cliente.');
        return;
    }

    db.collection('clients').doc(clientId).get().then((doc) => {
        if (!doc.exists) {
            console.error('Cliente no encontrado');
            return;
        }

        const clientData = doc.data();
        let totalSaleCliente = 0;

        if (!clientData.isActive) {
            const amount = prompt('El cliente no está activo. Por favor, ingrese un monto para sumarle:');
            totalSaleCliente = parseFloat(amount) || 0;
        }

        const now = new Date();
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        db.collection('visits').doc(today).get().then((doc) => {
            if (doc.exists) {
                const visitData = doc.data();
                const existingVisit = visitData.visits.find(visit => visit.clientId === clientId);

                if (existingVisit) {
                    alert('El cliente ya está registrado para hoy.');
                    return;
                } else {
                    const newVisitData = {
                        clientId: clientId,
                        clientName: clientName,
                        time: now.toISOString(),
                        TotalSaleCliente: totalSaleCliente,
                        status: 'iniciada',
                        products: []
                    };

                    return db.collection('visits').doc(today).update({
                        visits: firebase.firestore.FieldValue.arrayUnion(newVisitData),
                        totalVisits: firebase.firestore.FieldValue.increment(1)
                    }).then(() => {
                        console.log('TotalSaleCliente:', totalSaleCliente);
                        console.log('clientName:', clientName);
                        console.log('visitDate:', today);
                    });
                }
            } else {
                const visitData = {
                    clientId: clientId,
                    clientName: clientName,
                    time: now.toISOString(),
                    TotalSaleCliente: totalSaleCliente,
                    status: 'iniciada',
                    products: []
                };

                return db.collection('visits').doc(today).set({
                    date: today,
                    totalVisits: 1,
                    totalSales: 0,
                    visits: [visitData]
                }).then(() => {
                    console.log('TotalSaleCliente:', totalSaleCliente);
                    console.log('clientName:', clientName);
                    console.log('visitDate:', today);
                });
            }
        }).then(() => {
            console.log('Visita registrada');
            alert('Visita registrada con éxito.');
            updateClientRanking(clientId);
            loadVisits();
        }).catch((error) => {
            console.error('Error registrando visita: ', error);
        });
    }).catch((error) => {
        console.error('Error obteniendo datos del cliente: ', error);
    });
}

// Actualizar el ranking del cliente
function updateClientRanking(clientId) {
    db.collection('clients').doc(clientId).update({
        ranking: firebase.firestore.FieldValue.increment(1)
    }).then(() => {
        console.log('Ranking del cliente actualizado');
    }).catch((error) => {
        console.error('Error actualizando el ranking del cliente: ', error);
    });
}

function updateClientName() {
    const clientSelect = document.getElementById('visit-client-select');
    const clientName = clientSelect.options[clientSelect.selectedIndex].text;
    document.getElementById('visit-client-name').value = clientName;
}

// Establecer el filtro de fecha con la fecha actual
function setTodayDateFilter() {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    document.getElementById('visit-date-filter').value = today;
}

function loadVisits() {
    const visitDateFilter = document.getElementById('visit-date-filter').value;
    const startedVisitList = document.getElementById('started-visit-list');
    const finishedVisitList = document.getElementById('finished-visit-list');
    const summaryDate = document.getElementById('summary-date');
    const summaryTotalSales = document.getElementById('summary-totalSales');
    const summaryTotalVisits = document.getElementById('summary-totalVisits');

    startedVisitList.innerHTML = ''; // Limpiar el listado de visitas iniciadas
    finishedVisitList.innerHTML = ''; // Limpiar el listado de visitas finalizadas

    const query = visitDateFilter
        ? db.collection('visits').where('date', '==', visitDateFilter)
        : db.collection('visits');

    query.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const visitData = doc.data();

            // Actualizar el resumen
            summaryDate.textContent = `Fecha: ${visitData.date}`;
            summaryTotalSales.textContent = `Total Ventas: ${visitData.totalSales}`;
            summaryTotalVisits.textContent = `Total Visitas: ${visitData.totalVisits}`;

            visitData.visits.forEach((visit) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${visit.clientName}</strong> Gasto Total: Q${visit.TotalSaleCliente}`;

                if (visit.status === 'iniciada') {
                    const productList = document.createElement('ul');
                    visit.products.forEach((product) => {
                        const productItem = document.createElement('li');
                        productItem.textContent = `${product.name} - Cantidad: ${product.quantity}`;
                        productList.appendChild(productItem);
                    });

                    const finishButton = document.createElement('button');
                    finishButton.textContent = 'Finalizar';
                    finishButton.onclick = () => finishVisit(visit.clientId, visitDateFilter);

                    const buyButton = document.createElement('button');
                    buyButton.textContent = 'Compra';
                    buyButton.onclick = () => showProductModal(visit.clientId, visitDateFilter);

                    listItem.appendChild(productList);
                    listItem.appendChild(finishButton);
                    listItem.appendChild(buyButton);
                    startedVisitList.appendChild(listItem);
                } else if (visit.status === 'finalizada') {
                    const productList = document.createElement('ul');
                    visit.products.forEach((product) => {
                        const productItem = document.createElement('li');
                        productItem.textContent = `${product.name} - Cantidad: ${product.quantity}, Precio: Q${product.total}`;
                        productList.appendChild(productItem);
                    });

                    listItem.appendChild(productList);
                    finishedVisitList.appendChild(listItem);
                }
            });
        });
    }).catch((error) => {
        console.error('Error al cargar las visitas: ', error);
    });
}

// Cargar opciones de productos
function loadProductOptions() {
    const productSelect = document.getElementById('product-select');
    productSelect.innerHTML = '<option value="">Seleccione un producto</option>';

    db.collection('products').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${product.name} - $${product.salePrice}`;
            productSelect.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error obteniendo productos: ", error);
    });
}

// Mostrar el modal para agregar productos
function showProductModal(clientId, visitDate) {
    document.getElementById('product-modal').style.display = 'block';
    document.getElementById('product-modal').dataset.clientId = clientId;
    document.getElementById('product-modal').dataset.visitDate = visitDate;

    loadProductOptions();
}

// Cerrar el modal de productos
function closeProductModal() {
    const productModal = document.getElementById('product-modal');
    productModal.style.display = 'none';
}

function confirmAddProduct() {
    const productSelect = document.getElementById('product-select');
    const quantityInput = document.getElementById('product-quantity');
    const clientId = document.getElementById('product-modal').dataset.clientId;
    const visitDate = document.getElementById('product-modal').dataset.visitDate;

    const selectedProductId = productSelect.value;
    const selectedProductName = productSelect.options[productSelect.selectedIndex].text;
    const quantity = parseInt(quantityInput.value, 10);

    if (!selectedProductId || !quantity) {
        alert('Seleccione un producto y una cantidad válida.');
        return;
    }

    // Buscar el producto en la base de datos
    db.collection('products').doc(selectedProductId).get().then((doc) => {
        if (doc.exists) {
            const productData = doc.data();
            const totalCost = productData.salePrice * quantity;

            // Actualizar la visita del cliente con el nuevo producto y el gasto total
            db.collection('visits').doc(visitDate).get().then((doc) => {
                if (doc.exists) {
                    const visitData = doc.data();

                    visitData.visits.forEach((visit) => {
                        if (visit.clientId === clientId) {
                            visit.products.push({
                                name: selectedProductName,
                                quantity: quantity,
                                total: totalCost
                            });
                            visit.TotalSaleCliente += totalCost;
                        }
                    });

                    // Guardar la actualización en la base de datos
                    db.collection('visits').doc(visitDate).set(visitData).then(() => {
                        console.log('Producto agregado a la visita');
                        alert('Producto agregado con éxito.');
                        console.log('TotalSaleCliente:', visitData.TotalSaleCliente);
                        console.log('clientName:', visitData.clientName);
                        console.log('visitDate:', visitDate);
                        closeProductModal();
                        loadVisits();
                    }).catch((error) => {
                        console.error('Error actualizando la visita: ', error);
                    });
                }
            });

            // Actualizar el stock del producto
            db.collection('products').doc(selectedProductId).update({
                stock: firebase.firestore.FieldValue.increment(-quantity)
            }).then(() => {
                console.log('Stock del producto actualizado');
            }).catch((error) => {
                console.error('Error actualizando el stock del producto: ', error);
            });
        } else {
            console.error('Producto no encontrado en la base de datos');
        }
    }).catch((error) => {
        console.error('Error obteniendo el producto: ', error);
    });
}

// Finalizar la visita
function finishVisit(clientId, visitDate) {
    db.collection('visits').doc(visitDate).get().then((doc) => {
        if (doc.exists) {
            const visitData = doc.data();
            const clientVisit = visitData.visits.find(visit => visit.clientId === clientId);    
            if (clientVisit) {
                clientVisit.status = 'finalizada';
                visitData.totalSales += clientVisit.TotalSaleCliente;

                // Guardar la actualización en la base de datos
                db.collection('visits').doc(visitDate).set(visitData).then(() => {
                    console.log('Visita finalizada');
                    alert('Visita finalizada con éxito.');
                    console.log('TotalSaleCliente:', clientVisit.TotalSaleCliente);
                    const toClie = clientVisit.TotalSaleCliente;
                    console.log('clientName:', clientVisit.clientName);
                    const naClie = clientVisit.clientName;
                    console.log('visitDate:', visitDate);
                    const viClie = visitDate;
                    agregarVenta(toClie,naClie,viClie);
                    loadVisits();
                }).catch((error) => {
                    console.error('Error actualizando la visita: ', error);
                });
            } else {
                console.error('Visita del cliente no encontrada');
            }
        } else {
            console.error('Documento de visita no encontrado');
        }
    }).catch((error) => {
        console.error('Error obteniendo el documento de visita: ', error);
    });
}

function agregarVenta(toClie, naClie, viClie) {
    const ventasDocRef = db.collection('ventas').doc(viClie);

    ventasDocRef.get().then((doc) => {
        if (doc.exists) {
            // Si el documento existe, actualizar TotalVentaDia y agregar una nueva venta
            ventasDocRef.update({
                TotalVentaDia: firebase.firestore.FieldValue.increment(toClie)
            });

            const numVen = Object.keys(doc.data()).length - 1; // Restar 1 para no contar TotalVentaDia
            ventasDocRef.update({
                [`${numVen}`]: {
                    nombre: naClie,
                    totaldeventa: toClie
                }
            });
        } else {
            // Si el documento no existe, crearlo con la nueva venta
           // Si el documento no existe, créalo
           ventasDocRef.set({
            TotalVentaDia: toClie,
            '0': {
                nombre: naClie,
                totaldeventa: toClie
            }
        });
    }
}).catch((error) => {
    console.error("Error registrando la venta: ", error);
});
}

