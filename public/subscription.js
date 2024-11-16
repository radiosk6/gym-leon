
// Función para obtener y mostrar suscripciones
function fetchSubscriptions() {
    const filter = document.getElementById('subscription-filter').value;

    // Obtener suscripciones activas desde /subscriptions
    db.collection('subscriptions').get().then((querySnapshot) => {
        let activeSubscriptions = [];

        querySnapshot.forEach((doc) => {
            if (doc.id !== 'subscripcionesVencidas') { // Excluir la subcolección de suscripciones vencidas
                const subscription = { id: doc.id, ...doc.data() };
                activeSubscriptions.push(subscription);
            }
        });

        // Obtener suscripciones vencidas desde /subscriptions/subscripcionesVencidas/subscripcionesVencidas
        db.collection('subscriptions').doc('subscripcionesVencidas').collection('subscripcionesVencidas').get().then((querySnapshot) => {
            let inactiveSubscriptions = [];

            querySnapshot.forEach((doc) => {
                const subscription = { id: doc.id, ...doc.data() };
                inactiveSubscriptions.push(subscription);
            });

            // Ordenar las suscripciones según el filtro seleccionado
            if (filter === 'endDate') {
                activeSubscriptions.sort((a, b) => b.endDate.toDate() - a.endDate.toDate()); // Orden de mayor a menor
                inactiveSubscriptions.sort((a, b) => b.endDate.toDate() - a.endDate.toDate());
            } else if (filter === 'startDate') {
                activeSubscriptions.sort((a, b) => a.startDate.toDate() - b.startDate.toDate());
                inactiveSubscriptions.sort((a, b) => a.startDate.toDate() - b.startDate.toDate());
            } else if (filter === 'duration') {
                activeSubscriptions.sort((a, b) => a.duration - b.duration);
                inactiveSubscriptions.sort((a, b) => a.duration - b.duration);
            }

            // Mostrar las suscripciones activas
            const activeSubscriptionList = document.getElementById('active-subscription-list');
            activeSubscriptionList.innerHTML = '';
            activeSubscriptions.forEach((subscription, index) => {
                const startDate = subscription.startDate ? subscription.startDate.toDate().toLocaleDateString() : 'N/A';
                const endDate = subscription.endDate ? subscription.endDate.toDate().toLocaleDateString() : 'N/A';

                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${index + 1}. ${subscription.clientName}</strong>: ${subscription.duration} días, Desde: ${startDate} hasta ${endDate}`;
                activeSubscriptionList.appendChild(listItem);
            });

            // Mostrar las suscripciones vencidas
            const inactiveSubscriptionList = document.getElementById('inactive-subscription-list');
            inactiveSubscriptionList.innerHTML = '';
            inactiveSubscriptions.forEach((subscription, index) => {
                const startDate = subscription.startDate ? subscription.startDate.toDate().toLocaleDateString() : 'N/A';
                const endDate = subscription.endDate ? subscription.endDate.toDate().toLocaleDateString() : 'N/A';

                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${index + 1}. ${subscription.clientName}</strong>: ${subscription.duration} días, Desde: ${startDate} hasta ${endDate}`;
                inactiveSubscriptionList.appendChild(listItem);
            });

        }).catch((error) => {
            console.error("Error obteniendo suscripciones vencidas: ", error);
        });

    }).catch((error) => {
        console.error("Error obteniendo suscripciones: ", error);
    });
}



function printSubscriptions() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Listado de Suscripciones</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1, h2 { text-align: center; }
                    ul { list-style-type: none; padding: 0; }
                    li { padding: 5px; border-bottom: 1px solid #ddd; }
                    li strong { display: block; }
                </style>
            </head>
            <body>
                <h1>Listado de Suscripciones</h1>
                <h2>Activas</h2>
                <ul id="print-active-subscription-list">
                ${document.getElementById('active-subscription-list').innerHTML}
                </ul>
                <h2>Vencidas</h2>
                <ul id="print-inactive-subscription-list">
                ${document.getElementById('inactive-subscription-list').innerHTML}
                </ul>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}



// Registrar una venta
function registerSale(visitDate, saleName, saleTotal) {
    const salesRef = db.collection('ventas').doc(visitDate);

    salesRef.get().then((doc) => {
        if (doc.exists) {
            // Si el documento existe, actualiza los campos
            salesRef.update({
                TotalVentaDia: firebase.firestore.FieldValue.increment(saleTotal)
            });

            const numVen = Object.keys(doc.data()).length + 1; // Restar 1 para no contar TotalVentaDia
            salesRef.update({
                [`${numVen}`]: {
                    nombre: saleName,
                    totaldeventa: saleTotal
                }
            });
        } else {
            // Si el documento no existe, créalo
            salesRef.set({
                TotalVentaDia: saleTotal,
                '0': {
                    nombre: saleName,
                    totaldeventa: saleTotal
                }
            });
        }
    }).catch((error) => {
        console.error("Error registrando la venta: ", error);
    });
}


// Función para cargar las opciones de suscripciones en el select de eliminación
function loadDeleteSubscriptionOptions() {
    db.collection('subscriptions').where('endDate', '>', new Date()).get().then((querySnapshot) => {
        const deleteSubscriptionSelect = document.getElementById('delete-subscription-id');
        deleteSubscriptionSelect.innerHTML = '<option value="">Seleccione una suscripción</option>';
        
        querySnapshot.forEach((doc) => {
            const subscription = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;

            if (subscription.clientName && subscription.endDate) {
                option.textContent = `${subscription.clientName}: ${subscription.endDate.toDate().toLocaleDateString()}`;
            } else {
                console.error(`Error: Suscripción ${doc.id} está incompleta o sin datos de cliente/endDate.`);
                option.textContent = `Datos no disponibles`;
            }
            
            deleteSubscriptionSelect.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error obteniendo suscripciones para eliminar: ", error);
    });
}

// Función para eliminar la suscripción seleccionada y ajustar las ventas totales
function deleteSubscription(event) {
    event.preventDefault(); // Prevenir el envío del formulario

    const deleteSubscriptionSelect = document.getElementById('delete-subscription-id');
    const subscriptionId = deleteSubscriptionSelect.value;

    if (subscriptionId) {
        db.collection('subscriptions').doc(subscriptionId).get().then((doc) => {
            if (doc.exists) {
                const subscription = doc.data();
                const subscriptionPrice = subscription.price || 0; // Manejar el caso donde price podría ser undefined

                // Eliminar la suscripción
                db.collection('subscriptions').doc(subscriptionId).delete().then(() => {
                    console.log(`Suscripción ${subscriptionId} eliminada con éxito.`);

                    // Obtener la fecha actual en formato ISO
                    const visitDate = getCurrentDateFormatted();

                    // Ajustar las ventas totales para la visita del día actual
                    db.collection('visits').doc(visitDate).get().then((visitDoc) => {
                        if (visitDoc.exists) {
                            const visitData = visitDoc.data();
                            let updatedTotalSales = (visitData.totalSales || 0) - subscriptionPrice;

                            // Actualizar el total de ventas para la fecha actual
                            db.collection('visits').doc(visitDate).update({
                                totalSales: updatedTotalSales
                            }).then(() => {
                                console.log(`Ventas totales ajustadas a ${updatedTotalSales} para la fecha ${visitDate}.`);
                            }).catch((error) => {
                                console.error("Error actualizando ventas totales: ", error);
                            });
                        } else {
                            console.error("No se encontró un registro de visita para la fecha actual.");
                        }
                    }).catch((error) => {
                        console.error("Error obteniendo el registro de la visita del día: ", error);
                    });

                    // Redirigir a la sección de suscripciones mostradas
                    window.location.hash = '#subscription-list-section'; // Ajusta esto a la ID de la sección deseada

                }).catch((error) => {
                    console.error("Error eliminando la suscripción: ", error);
                });
            } else {
                console.error("Suscripción no encontrada.");
            }
        }).catch((error) => {
            console.error("Error obteniendo la suscripción: ", error);
        });
    } else {
        console.error("No se ha seleccionado ninguna suscripción.");
    }
}





// Función para cargar las opciones de suscripciones en el select excluyendo las vencidas
function loadSubscriptionOptions() {
    db.collection('subscriptions').get().then((querySnapshot) => {
        const editSubscriptionSelect = document.getElementById('edit-subscription-id');
        editSubscriptionSelect.innerHTML = '<option value="">Seleccione una suscripción</option>';

        querySnapshot.forEach((doc) => {
            // Ignorar la subcolección 'subscripcionesVencidas'
            if (doc.id !== 'subscripcionesVencidas') {
                const subscription = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;

                if (subscription.endDate && subscription.endDate.toDate) {
                    option.textContent = `${subscription.clientName}: ${subscription.endDate.toDate().toLocaleDateString()}`;
                } else {
                    console.error(`Error: La suscripción ${doc.id} no tiene una fecha de finalización válida.`);
                    option.textContent = `${subscription.clientName}: Fecha no disponible`;
                }
                
                editSubscriptionSelect.appendChild(option);
            }
        });
    }).catch((error) => {
        console.error("Error obteniendo suscripciones: ", error);
    });
}



// Función para obtener la información de la suscripción seleccionada
function loadSubscriptionDataForEdit() {
    const subscriptionId = document.getElementById('edit-subscription-id').value;

    if (subscriptionId) {
        db.collection('subscriptions').doc(subscriptionId).get().then((doc) => {
            if (doc.exists) {
                const subscription = doc.data();
                document.getElementById('edit-subscription-duration').value = subscription.duration;
            } else {
                console.error("Suscripción no encontrada");
            }
        }).catch((error) => {
            console.error("Error obteniendo suscripción: ", error);
        });
    } else {
        document.getElementById('edit-subscription-duration').value = '';
    }
}

// Función para editar la suscripción
function editSubscription(event) {
    event.preventDefault();
    const subscriptionId = document.getElementById('edit-subscription-id').value;
    const newDuration = document.getElementById('edit-subscription-duration').value;

    if (!subscriptionId || !newDuration) {
        alert('Por favor, complete todos los campos');
        return;
    }

    db.collection('subscriptions').doc(subscriptionId).get().then((doc) => {
        if (doc.exists) {
            const subscription = doc.data();
            const newEndDate = new Date(subscription.startDate.toDate());
            newEndDate.setDate(newEndDate.getDate() + parseInt(newDuration));

            db.collection('subscriptions').doc(subscriptionId).update({
                duration: newDuration,
                endDate: newEndDate
            }).then(() => {
                console.log("Suscripción actualizada");
                fetchSubscriptions();
            }).catch((error) => {
                console.error("Error actualizando suscripción: ", error);
            });
        } else {
            console.error("Suscripción no encontrada");
        }
    }).catch((error) => {
        console.error("Error obteniendo suscripción: ", error);
    });
}






// Función para evaluar y actualizar el estado de las suscripciones en la colección de suscripciones
function evaluateSubscriptionStatuses() {
    db.collection('subscriptions').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            loadClientOptions();
            // Ignorar la subcolección 'subscripcionesVencidas'
            if (doc.id !== 'subscripcionesVencidas') {
                const subscription = doc.data();
                const currentDate = new Date();

                // Asegurarse de que endDate es válido antes de continuar
                if (subscription.endDate && subscription.endDate.toDate) {
                    const endDate = subscription.endDate.toDate();
                    let isActive = currentDate <= endDate;

                    if (!isActive) {
                        // Si la suscripción está vencida, eliminarla de la colección principal
                        db.collection('subscriptions').doc(doc.id).delete().then(() => {
                            console.log(`Suscripción ${doc.id} vencida eliminada de la colección principal.`);

                            // Luego, agregarla a la subcolección subscripcionesVencidas
                            db.collection('subscriptions').doc('subscripcionesVencidas').collection('subscripcionesVencidas').add(subscription).then(() => {
                                console.log(`Suscripción ${doc.id} movida a la subcolección subscripcionesVencidas.`);
                            }).catch((error) => {
                                console.error("Error moviendo la suscripción a la subcolección: ", error);
                            });
                        }).catch((error) => {
                            console.error("Error eliminando la suscripción de la colección principal: ", error);
                        });
                    } else {
                        // Actualizar la variable isActive en la colección de suscripciones si todavía está activa
                        db.collection('subscriptions').doc(doc.id).update({
                            isActive: isActive
                        }).then(() => {
                            console.log(`Suscripción ${doc.id} actualizada: isActive = ${isActive}`);
                            fetchSubscriptions();
                        }).catch((error) => {
                            console.error("Error actualizando suscripción: ", error);
                        });
                    }
                } else {
                    console.error(`Error: La suscripción ${doc.id} no tiene una fecha de finalización válida.`);
                }
            }
        });
    }).catch((error) => {
        console.error("Error evaluando suscripciones: ", error);
    });
}

// Cargar opciones de clientes en el select
function loadClientOptions() {
   
    db.collection('clients').get().then((querySnapshot) => {
        const clientSelect = document.getElementById('subscription-client-id');
        clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>'; // Limpiar opciones anteriores
        console.log("Número de clientes obtenidos:", querySnapshot.size);
        querySnapshot.forEach((doc) => {
            const client = doc.data();
          
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error obteniendo opciones de clientes: ", error);
    });
}

// Añadir una suscripción
function addSubscription(event) {
    event.preventDefault();
    const clientId = document.getElementById('subscription-client-id').value;
    const subscriptionDuration = document.getElementById('subscription-duration').value;
    const subscriptionPrice = parseFloat(document.getElementById('subscription-price').value);

    if (!clientId) {
        alert('Por favor, seleccione un cliente');
        return;
    }

    if (!subscriptionDuration || isNaN(subscriptionPrice)) {
        alert('Por favor, ingrese una duración y un precio válidos');
        return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(subscriptionDuration));

    db.collection('clients').doc(clientId).get().then((doc) => {
        if (doc.exists) {
            const clientName = doc.data().name;
            db.collection('subscriptions').add({
                clientId: clientId,
                clientName: clientName,
                duration: subscriptionDuration,
                startDate: startDate,
                endDate: endDate,
                price: subscriptionPrice,
                isActive: true
            }).then(() => {
                db.collection('clients').doc(clientId).update({
                    isActive: true
                });

                // Registrar la visita
                const visitDate = startDate.toISOString().split('T')[0];
                db.collection('visits').doc(visitDate).set({
                    date: visitDate,
                    totalSales: firebase.firestore.FieldValue.increment(subscriptionPrice),
                   
                }, { merge: true });

                // Registrar la venta
                registerSale(visitDate, `Suscripción ${clientName}`, subscriptionPrice);

                console.log("Suscripción añadida");
                fetchSubscriptions();
                clearSubscriptionInputs();
                loadVisits()
            }).catch((error) => {
                console.error("Error añadiendo suscripción: ", error);
            });
        } else {
            console.error("Cliente no encontrado");
        }
    }).catch((error) => {
        console.error("Error obteniendo cliente: ", error);
    });
}
function clearSubscriptionInputs() {
    document.getElementById('subscription-client-id').value = '';
    document.getElementById('subscription-duration').value = '';
    document.getElementById('subscription-price').value = '';
}
// Inicializar la lista de clientes y cargar opciones en los selects
document.addEventListener("DOMContentLoaded", function() {
    
    loadDeleteSubscriptionOptions()
    evaluateSubscriptionStatuses();
    loadSubscriptionOptions(); // Cargar opciones de suscripciones en el select de edición
    fetchSubscriptions(); // Obtener y mostrar suscripciones
    loadClientOptions();
   
    document.getElementById('add-subscription-form').addEventListener('submit', addSubscription);
    document.getElementById('delete-subscription-form').addEventListener('submit', deleteSubscription);
 document.getElementById('subscription-filter').addEventListener('change', fetchSubscriptions);
    document.getElementById('edit-subscription-form').addEventListener('submit', editSubscription);
    document.getElementById('edit-subscription-id').addEventListener('change', loadSubscriptionDataForEdit);
    // Añadir listener al formulario



});