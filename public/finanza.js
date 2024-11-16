function loadClientOptionsDeuda() {
    const now = new Date();
    
    // Ajustar la hora a medianoche para evitar problemas con la hora actual
    now.setHours(0, 0, 0, 0);
    const today = now.toISOString().slice(0, 10); // Fecha en formato YYYY-MM-DD
    
    const clientSelect = document.getElementById('clienteId');

    db.collection('visits').doc(today).get().then((doc) => {
        if (doc.exists) {
            const visitsData = doc.data().visits;
            clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';

            Object.keys(visitsData).forEach(key => {
                const visit = visitsData[key];
                const option = document.createElement('option');
                option.value = visit.clientId;
                option.textContent = `${visit.clientName} - ${visit.TotalSaleCliente}`;
                option.dataset.clientName = visit.clientName; // Guardar el nombre del cliente en un atributo del <option>
                clientSelect.appendChild(option);
            });
        } else {
            clientSelect.innerHTML = '<option value="">No hay visitas para la fecha actual</option>';
        }
    }).catch((error) => {
        console.error("Error al cargar opciones de clientes: ", error);
    });
}


function ingresoDeuda(clienteId, clienteName, monto) {
    const deudaRef = db.collection('deudas').where('clienteId', '==', clienteId).where('pagado', '==', false);

    deudaRef.get().then((querySnapshot) => {
        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const deudaData = doc.data();
                const nuevaDeuda = deudaData.monto + monto;

                doc.ref.update({
                    monto: nuevaDeuda,
                    sumaDeuda: firebase.firestore.FieldValue.arrayUnion({
                        fecha: firebase.firestore.Timestamp.fromDate(new Date()),
                        monto: monto
                    })
                }).then(() => {
                    console.log("Deuda actualizada con éxito.");
                    actualizarTotalSales(monto); // Restar el monto de totalSales
                    loadDeudaOptions();
                }).catch((error) => {
                    console.error("Error actualizando la deuda: ", error);
                });
            });
        } else {
            const nuevaDeudaRef = db.collection('deudas').doc();
            nuevaDeudaRef.set({
                clienteId: clienteId,
                clienteName: clienteName,
                monto: monto,
                sumaDeuda: [{
                    fecha: firebase.firestore.Timestamp.fromDate(new Date()),
                    monto: monto
                }],
                fechaIngreso: firebase.firestore.Timestamp.fromDate(new Date()),
                pagado: false
            }).then(() => {
                console.log("Deuda registrada con éxito.");
                actualizarTotalSales(monto); // Restar el monto de totalSales
                loadDeudaOptions();
                listadoDeudaActiva();
                listadoDeudaPagadas();
            }).catch((error) => {
                console.error("Error registrando la deuda: ", error);
            });
        }
    }).catch((error) => {
        console.error("Error verificando deudas existentes: ", error);
    });
}


// Manejar el envío del formulario de ingreso de deuda
document.getElementById('ingreso-deuda-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const clienteSelect = document.getElementById('clienteId');
    const clienteId = clienteSelect.value;
    const clienteName = clienteSelect.options[clienteSelect.selectedIndex].dataset.clientName; // Obtener el nombre del cliente
    const monto = parseFloat(document.getElementById('monto').value);

    if (clienteId) {
        ingresoDeuda(clienteId, clienteName, monto); // Pasar el nombre del cliente a la función
        document.getElementById('ingreso-deuda-form').reset();
    } else {
        alert("Seleccione un cliente válido.");
    }
});

// Cargar opciones de clientes al cargar la página
document.addEventListener('DOMContentLoaded', loadClientOptionsDeuda);
function actualizarTotalSales(monto) {
    const fechaActual = new Date();
    const fechaString = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')}`;

    // Acceder al documento con ID de la fecha actual en la colección 'visits'
    const totalSalesRef = db.collection('visits').doc(fechaString);

    totalSalesRef.get().then((doc) => {
        if (doc.exists) {
            const totalSalesData = doc.data();
            const nuevoTotalSales = totalSalesData.totalSales - monto;

            totalSalesRef.update({
                totalSales: nuevoTotalSales
            }).then(() => {
                console.log("Total de ventas actualizado con éxito.");
                loadVisits();
            }).catch((error) => {
                console.error("Error actualizando el total de ventas: ", error);
            });
        } else {
            console.error("No se encontró el documento de total de ventas.");
        }
    }).catch((error) => {
        console.error("Error obteniendo el total de ventas: ", error);
    });
}



// Función para cargar las opciones de deudas en el selector
function loadDeudaOptions() {
    const deudaSelect = document.getElementById('deudaId');

    db.collection('deudas').get().then((querySnapshot) => {
        deudaSelect.innerHTML = '<option value="">Seleccione una deuda</option>';
        querySnapshot.forEach((doc) => {
            const deuda = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${deuda.clienteName} - ${deuda.monto}`;
            deudaSelect.appendChild(option);
        });
    }).catch((error) => {
        console.error("Error al cargar opciones de deudas: ", error);
    });
}

function actualizarTotalSalesConAbono(abono) {
    const fechaActual = new Date();
    const fechaString = `${fechaActual.getFullYear()}-${(fechaActual.getMonth() + 1).toString().padStart(2, '0')}-${fechaActual.getDate().toString().padStart(2, '0')}`;

    const totalSalesRef = db.collection('visits').doc(fechaString);

    totalSalesRef.get().then((doc) => {
        if (doc.exists) {
            const totalSalesData = doc.data();
            const nuevoTotalSales = totalSalesData.totalSales + abono;

            totalSalesRef.update({
                totalSales: nuevoTotalSales
            }).then(() => {
                console.log("Total de ventas actualizado con éxito tras el abono.");
                loadVisits();
                listadoDeudaActiva();
                listadoDeudaPagadas();
            }).catch((error) => {
                console.error("Error actualizando el total de ventas: ", error);
            });
        } else {
            console.error("No se encontró el documento de total de ventas.");
        }
    }).catch((error) => {
        console.error("Error obteniendo el total de ventas: ", error);
    });
}

function pagoDeuda(deudaId, abono) {
    const deudaRef = db.collection('deudas').doc(deudaId);

    deudaRef.get().then((doc) => {
        if (doc.exists) {
            const deuda = doc.data();
            const montoRestante = deuda.monto - abono;

            if (montoRestante <= 0) {
                const pagadasRef = db.collection('deudasPagadas').doc(deudaId);
                pagadasRef.set({
                    ...deuda,
                    fechaPago: firebase.firestore.Timestamp.fromDate(new Date()),
                    pagado: true
                }).then(() => {
                    deudaRef.delete().then(() => {
                        console.log("Deuda pagada y movida a deudasPagadas.");
                        actualizarTotalSalesConAbono(abono); // Sumar el abono a totalSales
                        loadDeudaOptions();
                        listadoDeudaActiva();
                        listadoDeudaPagadas();
                    }).catch((error) => {
                        console.error("Error eliminando la deuda de deudas: ", error);
                    });
                }).catch((error) => {
                    console.error("Error moviendo la deuda a deudasPagadas: ", error);
                });
            } else {
                deudaRef.update({
                    monto: montoRestante
                }).then(() => {
                    console.log("Deuda actualizada con el abono.");
                    actualizarTotalSalesConAbono(abono); // Sumar el abono a totalSales
                    registrarAbono(deudaRef, abono);
                    loadDeudaOptions();
                    listadoDeudaActiva();
                    listadoDeudaPagadas();
                }).catch((error) => {
                    console.error("Error actualizando la deuda: ", error);
                });
            }
        } else {
            console.error("No se encontró la deuda.");
        }
    }).catch((error) => {
        console.error("Error obteniendo la deuda: ", error);
    });
}

function registrarAbono(deudaRef, abono) {
    // Crear el objeto del abono, con el monto como un valor negativo
    const nuevoAbono = {
        fecha: firebase.firestore.Timestamp.fromDate(new Date()),
        monto: -Math.abs(abono)  // Asegurarse de que el monto sea negativo
    };

    // Añadir el abono al array de sumaDeuda
    deudaRef.update({
        sumaDeuda: firebase.firestore.FieldValue.arrayUnion(nuevoAbono)
    }).then(() => {
        console.log("Abono registrado en la deuda.");
    }).catch((error) => {
        console.error("Error registrando el abono: ", error);
    });
}

// Manejar el envío del formulario de pago de deuda
document.getElementById('pago-deuda-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const deudaId = document.getElementById('deudaId').value;
    const abono = parseFloat(document.getElementById('abono').value);

    if (deudaId && !isNaN(abono) && abono > 0) {
        pagoDeuda(deudaId, abono);
        document.getElementById('pago-deuda-form').reset();
    } else {
        alert("Seleccione una deuda válida y asegúrese de ingresar un monto válido.");
    }
});

// Cargar opciones de deudas al cargar la página
document.addEventListener('DOMContentLoaded', loadDeudaOptions);

function listadoDeudaActiva() {
    const tablaActivas = document.getElementById('tabla-deudas-activas').getElementsByTagName('tbody')[0];
    tablaActivas.innerHTML = ''; // Limpiar tabla antes de agregar nuevos datos

    db.collection('deudas').where('pagado', '==', false).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const deuda = doc.data();
            const fila = tablaActivas.insertRow();
            
            // Insertar datos del cliente y monto total
            const clienteCell = fila.insertCell(0);
            clienteCell.textContent = deuda.clienteName || deuda.clienteId;
            clienteCell.style.cursor = 'pointer';
            clienteCell.dataset.clientId = doc.id; // Guardar el ID del cliente en un data-attribute

            fila.insertCell(1).textContent = deuda.monto;
            
            // Agregar evento de clic al nombre del cliente
            clienteCell.addEventListener('click', function() {
                mostrarDetallesDeuda(this.dataset.clientId);
            });
        });
    }).catch((error) => {
        console.error("Error obteniendo deudas activas: ", error);
    });
}
function mostrarDetallesDeuda(clientId) {
    const modal = document.getElementById("modal-historial-deuda");
    const detallesHistorial = document.getElementById("detalles-historial");
    const modalTitulo = document.getElementById("modal-titulo");

    // Limpiar contenido previo del modal
    detallesHistorial.innerHTML = '';

    // Llamar a Firestore para obtener los detalles de la deuda
    db.collection('deudas').doc(clientId).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            modalTitulo.textContent = `Historial de ${data.clienteName}`;
            detallesHistorial.innerHTML = `
                <p><strong>Monto Total:</strong> Q${data.monto}</p>
                <h3>Incrementos de Deuda:</h3>
                <ul>
                    ${data.sumaDeuda.map(incremento => `
                        <li>Fecha: ${incremento.fecha.toDate().toLocaleDateString()}, Monto: Q${incremento.monto}</li>
                    `).join('')}
                </ul>
            `;
            modal.style.display = "block";  // Mostrar el modal
        } else {
            alert("No se encontraron detalles de deuda para este cliente.");
        }
    }).catch(error => {
        console.error("Error obteniendo los detalles de la deuda: ", error);
    });

    // Manejar cierre del modal
    const span = document.getElementsByClassName("close")[0];
    span.onclick = function() {
        modal.style.display = "none";  // Ocultar el modal
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";  // Ocultar el modal si se hace clic fuera de él
        }
    }

    // Guardar como PDF
    document.getElementById('guardar-pdf').onclick = function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(modalTitulo.textContent, 10, 10);

        doc.setFontSize(12);
        let yOffset = 20; // Desplazamiento vertical para el contenido

        // Agregar el contenido del historial al PDF
        const contentLines = doc.splitTextToSize(detallesHistorial.innerText, 180);
        contentLines.forEach(line => {
            doc.text(line, 10, yOffset);
            yOffset += 10;
        });

        doc.save(`${modalTitulo.textContent}.pdf`);
    };
}



// Cargar las tablas de deudas al cargar la página


function listadoDeudaPagadas() {
    const tablaPagadas = document.getElementById('tabla-deudas-pagadas').getElementsByTagName('tbody')[0];
    tablaPagadas.innerHTML = ''; // Limpiar tabla

    db.collection('deudasPagadas').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const deuda = doc.data();
            const fila = tablaPagadas.insertRow();
            fila.insertCell(0).textContent = deuda.clienteName || deuda.clienteId; // Mostrar nombre o ID del cliente
            fila.insertCell(1).textContent = deuda.monto;
            fila.insertCell(2).textContent = deuda.descripcion || 'N/A'; // Mostrar descripción si está disponible
            fila.insertCell(3).textContent = deuda.fechaIngreso.toDate().toLocaleDateString();
            fila.insertCell(4).textContent = deuda.fechaPago.toDate().toLocaleDateString();
        });
    }).catch((error) => {
        console.error("Error obteniendo deudas pagadas: ", error);
    });
}

// Cargar las tablas de deudas al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    listadoDeudaActiva();
    listadoDeudaPagadas();
    document.getElementById('reporte-financiero').addEventListener('submit', generateReport);

});


async function generateReport() {
    // Limpiar los datos anteriores
    document.getElementById('reportPeriod').textContent = '';
    document.getElementById('totalIncome').textContent = '';
    document.getElementById('totalExpenses').textContent = '';
    document.getElementById('netBalance').textContent = '';
    document.getElementById('totalSubscriptions').textContent = '';
    document.getElementById('totalSubscriptionAmount').textContent = '';
    document.getElementById('totalProductsSold').textContent = '';
    document.getElementById('productSalesSummary').innerHTML = '';
    document.getElementById('topClients').innerHTML = '';

    // Limpiar las proyecciones anteriores
    document.getElementById('projectedIncome').textContent = '';
    document.getElementById('projectedExpenses').textContent = '';
    document.getElementById('projectedNetBalance').textContent = '';
    document.getElementById('projectedSubscriptions').textContent = '';
    document.getElementById('projectedProductsSold').textContent = '';

    const reportfiStartDateInput = document.getElementById('fecha-inicio').value;
    const reportfiEndDateInput = document.getElementById('fecha-fin').value;

    console.log('Fecha de inicio:', reportfiStartDateInput);
    console.log('Fecha de fin:', reportfiEndDateInput);

    if (!reportfiStartDateInput || !reportfiEndDateInput) {
        alert('Por favor, selecciona ambas fechas.');
        return;
    }

    const reportfiStartDate = new Date(reportfiStartDateInput);
    const reportfiEndDate = new Date(reportfiEndDateInput);

    if (isNaN(reportfiStartDate.getTime()) || isNaN(reportfiEndDate.getTime())) {
        alert('Fecha inválida. Por favor, selecciona una fecha válida.');
        return;
    }

    if (reportfiStartDate > reportfiEndDate) {
        alert('La fecha de inicio no puede ser después de la fecha de fin.');
        return;
    }

    // Convertir las fechas al formato YYYY-MM-DD
    const reportfiStartISODate = reportfiStartDate.toISOString().split('T')[0];
    const reportfiEndISODate = reportfiEndDate.toISOString().split('T')[0];

    console.log('Buscando ventas entre:', reportfiStartISODate, 'y', reportfiEndISODate);

    try {
        // Consultar ingresos
        const reportfiIncomeSnapshot = await db.collection('ventas')
            .where('__name__', '>=', reportfiStartISODate)
            .where('__name__', '<=', reportfiEndISODate)
            .get();

        console.log('Documentos encontrados:', reportfiIncomeSnapshot.size);

        let reportfiTotalIncome = 0;
        reportfiIncomeSnapshot.forEach(doc => {
            reportfiTotalIncome += doc.data().TotalVentaDia;
            console.log('TotalVentaDia del documento:', doc.data().TotalVentaDia);
        });

        console.log('Ingreso total calculado:', reportfiTotalIncome);
        document.getElementById('totalIncome').textContent = reportfiTotalIncome;

        // Consultar gastos
        const reportfiExpenseSnapshot = await db.collection('Gasto')
            .where('__name__', '>=', reportfiStartISODate)
            .where('__name__', '<=', reportfiEndISODate)
            .get();

        console.log('Documentos encontrados:', reportfiExpenseSnapshot.size);

        let reportfiTotalExpenses = 0;
        reportfiExpenseSnapshot.forEach(doc => {
            reportfiTotalExpenses += doc.data().TotalgastoDia;
            console.log('TotalgastoDia del documento:', doc.data().TotalgastoDia);
        });

        console.log('Gasto total calculado:', reportfiTotalExpenses);
        document.getElementById('totalExpenses').textContent = reportfiTotalExpenses;

        const netBalancejs = reportfiTotalIncome - reportfiTotalExpenses; 
        document.getElementById('netBalance').textContent = netBalancejs;

        // Top 10 Clientes que más visitaron
        const reportfiVisitsSnapshot = await db.collection('visits')
            .where('__name__', '>=', reportfiStartISODate)
            .where('__name__', '<=', reportfiEndISODate)
            .get();

        console.log('Documentos encontrados:', reportfiVisitsSnapshot.size);

        const reportfiClientVisits = {};
        reportfiVisitsSnapshot.forEach(doc => {
            const visitsArray = doc.data().visits; // Asumiendo que hay un array de visitas en cada documento
            visitsArray.forEach(visit => {
                const clientId = visit.clientId;
                if (reportfiClientVisits[clientId]) {
                    reportfiClientVisits[clientId]++;
                } else {
                    reportfiClientVisits[clientId] = 1;
                }
            });
        });

        // Obtener nombres y apodos de los clientes
        const clientDetailsPromises = Object.keys(reportfiClientVisits)
            .filter(clientId => clientId) // Filtramos los clientId que no están vacíos
            .map(clientId => 
                db.collection('clients').doc(clientId).get()
            );

        const clientDetailsSnapshots = await Promise.all(clientDetailsPromises);

        const reportfiClientDetails = {};
        clientDetailsSnapshots.forEach(snapshot => {
            if (snapshot.exists) {
                const clientData = snapshot.data();
                reportfiClientDetails[snapshot.id] = `${clientData.name} (${clientData.alias})`;
            }
        });

        // Crear la lista de los 10 clientes con más visitas con nombres y apodos
        const reportfiTopClients = Object.entries(reportfiClientVisits)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([clientId, count]) => `${reportfiClientDetails[clientId]}: ${count} visitas`);

        document.getElementById('topClients').innerHTML = reportfiTopClients.map(client => `<li>${client}</li>`).join('');

        // Total de suscripciones vendidas
        let totalSubscriptionsCount = 0;
        let totalSubscriptionAmount = 0;

        console.log('Buscando suscripciones entre:', reportfiStartISODate, 'y', reportfiEndISODate);

        const reportfiStartTimestamp = firebase.firestore.Timestamp.fromDate(reportfiStartDate);
        const reportfiEndTimestamp = firebase.firestore.Timestamp.fromDate(reportfiEndDate);

        console.log('Buscando suscripciones entre:', reportfiStartTimestamp.toDate(), 'y', reportfiEndTimestamp.toDate());

        const activeSubscriptionsSnapshot = await db.collection('subscriptions')
            .where('startDate', '>=', reportfiStartTimestamp)
            .where('startDate', '<=', reportfiEndTimestamp)
            .get();

        console.log('Documentos de suscripciones activas encontrados:', activeSubscriptionsSnapshot.size);

        activeSubscriptionsSnapshot.forEach(doc => {
            const subscriptionData = doc.data();
            const price = subscriptionData.price;
            console.log('Precio de suscripción activa:', price);

            if (typeof price === 'number') {
                totalSubscriptionsCount++;
                totalSubscriptionAmount += price;
            } else {
                console.error('Error: Campo `price` faltante o no es un número en el documento:', doc.id);
            }
        });

        const expiredSubscriptionsSnapshot = await db.collection('subscriptions')
            .doc('subscripcionesVencidas')
            .collection('subscripcionesVencidas')
            .where('startDate', '>=', reportfiStartTimestamp)
            .where('startDate', '<=', reportfiEndTimestamp)
            .get();

        console.log('Documentos de suscripciones vencidas encontrados:', expiredSubscriptionsSnapshot.size);

        expiredSubscriptionsSnapshot.forEach(doc => {
            const subscriptionData = doc.data();
            const price = subscriptionData.price;
            console.log('Precio de suscripción vencida:', price);

            if (typeof price === 'number') {
                totalSubscriptionsCount++;
                totalSubscriptionAmount += price;
            } else {
                console.error('Error: Campo `price` faltante o no es un número en el documento:', doc.id);
            }
        });

        console.log('Cantidad total de suscripciones procesadas:', totalSubscriptionsCount);
        console.log('Monto total de suscripciones calculado:', totalSubscriptionAmount);

        document.getElementById('totalSubscriptions').textContent = totalSubscriptionsCount;
        document.getElementById('totalSubscriptionAmount').textContent = totalSubscriptionAmount.toFixed(2);

        // Consultar productos vendidos
        const reportfiProductsSnapshot = await db.collection('visits')
            .where('__name__', '>=', reportfiStartISODate)
            .where('__name__', '<=', reportfiEndISODate)
            .get();

        console.log('Documentos de visitas encontrados:', reportfiProductsSnapshot.size);

        let reportfiTotalProductsSold = 0;
        let productSalesSummary = {};

        reportfiProductsSnapshot.forEach(doc => {
            const visitData = doc.data();
            const visitsArray = Object.values(visitData.visits || {});

            visitsArray.forEach(visit => {
                const productsArray = Object.values(visit.products || {});

                productsArray.forEach(product => {
                    const productName = product.name || 'Producto sin nombre';
                    const productQuantity = product.quantity || 0;

                    if (typeof productQuantity === 'number') {
                        reportfiTotalProductsSold += productQuantity;
                    } else {
                        console.error('Cantidad de producto no es un número:', productQuantity);
                    }

                    if (productSalesSummary[productName]) {
                        productSalesSummary[productName] += productQuantity;
                    } else {
                        productSalesSummary[productName] = productQuantity;
                    }
                });
            });
        });

        console.log('Cantidad total de productos vendidos:', reportfiTotalProductsSold);
        console.log('Resumen de productos vendidos:', productSalesSummary);

        document.getElementById('totalProductsSold').textContent = reportfiTotalProductsSold;

        const productSalesSummaryElement = document.getElementById('productSalesSummary');
        productSalesSummaryElement.innerHTML = '';

        for (const [productName, quantitySold] of Object.entries(productSalesSummary)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${productName}: ${quantitySold} unidades vendidas`;
            productSalesSummaryElement.appendChild(listItem);
        }

        // Ahora que el reporte está generado, calcular las proyecciones
        const projections = calculateProjections(
            reportfiTotalIncome,
            reportfiTotalExpenses,
            totalSubscriptionsCount,
            reportfiTotalProductsSold
        );

        // Mostrar las proyecciones en la interfaz
        document.getElementById('projectedIncome').textContent = projections.projectedIncome.toFixed(2);
        document.getElementById('projectedExpenses').textContent = projections.projectedExpenses.toFixed(2);
        document.getElementById('projectedNetBalance').textContent = projections.projectedNetBalance.toFixed(2);
        document.getElementById('projectedSubscriptions').textContent = projections.projectedSubscriptions.toFixed(2);
        document.getElementById('projectedProductsSold').textContent = projections.projectedProductsSold.toFixed(2);

    } catch (error) {
        console.error("Error generating report:", error);
    }
}

function calculateProjections(currentIncome, currentExpenses, currentSubscriptions, currentProductsSold) {
    const growthRate = 0.05;

    const projectedIncome = currentIncome * (1 + growthRate);
    const projectedExpenses = currentExpenses * (1 + growthRate);
    const projectedNetBalance = projectedIncome - projectedExpenses;
    const projectedSubscriptions = currentSubscriptions * (1 + growthRate);
    const projectedProductsSold = currentProductsSold * (1 + growthRate);

    return {
        projectedIncome,
        projectedExpenses,
        projectedNetBalance,
        projectedSubscriptions,
        projectedProductsSold
    };
}

async function generateMonthlyReport() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setReportDateRange(firstDayOfMonth, lastDayOfMonth);
    await generateReport();
}

function generateQuarterlyReport() {
    const now = new Date();
    const currentQuarter = Math.floor((now.getMonth() + 3) / 3);
    const firstMonthOfQuarter = (currentQuarter - 1) * 3;
    const firstDayOfQuarter = new Date(now.getFullYear(), firstMonthOfQuarter, 1);
    const lastDayOfQuarter = new Date(now.getFullYear(), firstMonthOfQuarter + 3, 0);

    setReportDateRange(firstDayOfQuarter, lastDayOfQuarter);
    generateReport();
}

function generateAnnualReport() {
    const now = new Date();
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(now.getFullYear(), 11, 31);

    setReportDateRange(firstDayOfYear, lastDayOfYear);
    generateReport();
}

function setReportDateRange(startDate, endDate) {
    const startISODate = startDate.toISOString().split('T')[0];
    const endISODate = endDate.toISOString().split('T')[0];

    document.getElementById('fecha-inicio').value = startISODate;
    document.getElementById('fecha-fin').value = endISODate;
}

function exportReportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte Financiero', 14, 22);

    const reportPeriod = document.getElementById('reportPeriod').textContent;
    const totalIncome = document.getElementById('totalIncome').textContent;
    const totalExpenses = document.getElementById('totalExpenses').textContent;
    const netBalance = document.getElementById('netBalance').textContent;
    const totalSubscriptions = document.getElementById('totalSubscriptions').textContent;
    const totalSubscriptionAmount = document.getElementById('totalSubscriptionAmount').textContent;
    const totalProductsSold = document.getElementById('totalProductsSold').textContent;

    doc.setFontSize(14);
    doc.text(`Período: ${reportPeriod}`, 14, 32);
    doc.text(`Total Ingresos: ${totalIncome}`, 14, 42);
    doc.text(`Total Gastos: ${totalExpenses}`, 14, 52);
    doc.text(`Balance Neto: ${netBalance}`, 14, 62);

    doc.text('Suscripciones:', 14, 72);
    doc.text(`Total Suscripciones Vendidas: ${totalSubscriptions}`, 14, 82);
    doc.text(`Monto Total de Suscripciones: ${totalSubscriptionAmount}`, 14, 92);

    doc.text('Ventas de Productos:', 14, 102);
    doc.text(`Cantidad Total de Productos Vendidos: ${totalProductsSold}`, 14, 112);

    const productSalesSummary = [];
    document.querySelectorAll('#productSalesSummary li').forEach((li) => {
        productSalesSummary.push([li.textContent]);
    });
    doc.autoTable({
        head: [['Producto', 'Cantidad Vendida']],
        body: productSalesSummary,
        startY: 122,
    });

    const topClients = [];
    document.querySelectorAll('#topClients li').forEach((li) => {
        topClients.push([li.textContent]);
    });
    doc.autoTable({
        head: [['Top 10 Clientes']],
        body: topClients,
        startY: doc.previousAutoTable.finalY + 10,
    });

    doc.save('reporte_financiero.pdf');
}
function calculateTotalCash() {
    // Obtener los valores de cada denominación
    const q100 = parseInt(document.getElementById('q100').value) || 0;
    const q50 = parseInt(document.getElementById('q50').value) || 0;
    const q20 = parseInt(document.getElementById('q20').value) || 0;
    const q10 = parseInt(document.getElementById('q10').value) || 0;
    const q5 = parseInt(document.getElementById('q5').value) || 0;
    const q1 = parseInt(document.getElementById('q1').value) || 0;
    const q0_50 = parseInt(document.getElementById('q0_50').value) || 0;
    const q0_25 = parseInt(document.getElementById('q0_25').value) || 0;

    // Calcular el total
    const total = (q100 * 100) + (q50 * 50) + (q20 * 20) + (q10 * 10) + 
                  (q5 * 5) + (q1 * 1) + (q0_50 * 0.50) + (q0_25 * 0.25);

    // Mostrar un desglose al usuario
    const summary = `
        <h4>Desglose del Efectivo</h4>
        <p>Q100: ${q100} billetes = Q${q100 * 100}</p>
        <p>Q50: ${q50} billetes = Q${q50 * 50}</p>
        <p>Q20: ${q20} billetes = Q${q20 * 20}</p>
        <p>Q10: ${q10} billetes = Q${q10 * 10}</p>
        <p>Q5: ${q5} billetes = Q${q5 * 5}</p>
        <p>Q1: ${q1} billetes = Q${q1 * 1}</p>
        <p>Q0.50: ${q0_50} monedas = Q${q0_50 * 0.50}</p>
        <p>Q0.25: ${q0_25} monedas = Q${q0_25 * 0.25}</p>
        <h3>Total: Q${total.toFixed(2)}</h3>
        <button type="button" onclick="confirmAndSaveCash(${total.toFixed(2)})">Confirmar y Guardar</button>
    `;
    document.getElementById('cash-summary').innerHTML = summary;
}

function confirmAndSaveCash(total) {
    const confirmation = confirm(`¿Estás seguro de que deseas guardar un total de Q${total.toFixed(2)} en caja?`);
    if (confirmation) {
        const today = new Date(); // Asegúrate de que 'today' sea un objeto Date
        const formattedDate = today.toISOString().split('T')[0];

        // Guardar los datos en la base de datos
        db.collection('caja').doc(formattedDate).set({
            total: total,
            fecha: firebase.firestore.Timestamp.fromDate(today)
        })
        .then(() => {
            alert('El total en caja se ha guardado exitosamente.');
            document.getElementById('cash-count-form').reset();
            document.getElementById('cash-summary').innerHTML = '';
        })
        .catch((error) => {
            console.error("Error guardando el total en caja: ", error);
        });
    }
}
