let visitsChart; // Almacenar la instancia del gráfico de visitas
let productSalesChart; // Almacenar la instancia del gráfico de ventas de productos

// Función para obtener datos de visitas y mostrar gráfico
function fetchVisitsData(startDate, endDate) {
    console.log(`Fetching visits data from ${startDate} to ${endDate}`);
    
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    
    db.collection('visits')
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get()
        .then((querySnapshot) => {
            console.log(`Fetched ${querySnapshot.size} documents`);
            const visitsData = {};
            querySnapshot.forEach((doc) => {
                const visit = doc.data();
                console.log(`Fetched visit: `, visit);
                const date = visit.date;
                if (!visitsData[date]) {
                    visitsData[date] = { totalSales: 0, totalVisits: 0 };
                }
                visitsData[date].totalSales += visit.totalSales;
                visitsData[date].totalVisits += visit.totalVisits;
            });

            console.log('Aggregated visits data:', visitsData);

            const labels = Object.keys(visitsData);
            const totalSalesData = labels.map(date => visitsData[date].totalSales);
            const totalVisitsData = labels.map(date => visitsData[date].totalVisits);

            renderVisitsChart(labels, totalSalesData, totalVisitsData);
        })
        .catch((error) => {
            console.error('Error obteniendo datos de visitas: ', error);
        });
}

// Función para renderizar el gráfico de visitas
function renderVisitsChart(labels, totalSalesData, totalVisitsData) {
    // Formatear las etiquetas con el día de la semana sin el año
    const formattedLabels = labels.map(date => getDayName(date));
    
    const ctx = document.getElementById('visitsChart').getContext('2d');

    // Destruir el gráfico existente si ya existe
    if (visitsChart) {
        visitsChart.destroy();
    }

    visitsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Total Sales',
                    data: totalSalesData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false,
                    yAxisID: 'y1'
                },
                {
                    label: 'Total Visits',
                    data: totalVisitsData,
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    yAxisID: 'y2'
                }
            ]
        },
        options: {
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        beginAtZero: true
                    },
                    title: {
                        display: true,
                        text: 'Total Sales'
                    }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    ticks: {
                        beginAtZero: true
                    },
                    title: {
                        display: true,
                        text: 'Total Visits'
                    }
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    // Mostrar estadísticas de los últimos 7 días al cargar la página
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = getCurrentDateFormatted();

    fetchVisitsData(startDate, endDate);
    fetchProductSalesData(startDate, endDate);

    // Eventos para los botones de obtención de datos
    document.getElementById('fetchVisitsBtn').addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        fetchVisitsData(startDate, endDate);
    });

    document.getElementById('fetchProductSalesBtn').addEventListener('click', function() {
        const startDate = document.getElementById('productStartDate').value;
        const endDate = document.getElementById('productEndDate').value;
        fetchProductSalesData(startDate, endDate);
    });
});

// Función para obtener datos de ventas de productos y mostrar gráfico
function fetchProductSalesData(startDate, endDate) {
    console.log(`Fetching product sales data from ${startDate} to ${endDate}`);

    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];

    db.collection('visits')
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get()
        .then((querySnapshot) => {
            console.log(`Fetched ${querySnapshot.size} documents`);
            const productSales = {};

            querySnapshot.forEach((doc) => {
                const visit = doc.data();
                if (visit.visits) {
                    visit.visits.forEach((v) => {
                        if (v.products) {
                            v.products.forEach((p) => {
                                if (!productSales[p.name]) {
                                    productSales[p.name] = 0;
                                }
                                productSales[p.name] += p.quantity;
                            });
                        }
                    });
                }
            });

            console.log('Aggregated product sales data:', productSales);

            const labels = Object.keys(productSales);
            const salesData = labels.map(product => productSales[product]);

            renderProductSalesChart(labels, salesData);
        })
        .catch((error) => {
            console.error('Error obteniendo datos de ventas de productos: ', error);
        });
}

// Función para renderizar el gráfico de ventas de productos
function renderProductSalesChart(labels, salesData) {
    console.log('Rendering product sales chart with labels:', labels);
    console.log('Sales Data:', salesData);
    const ctx = document.getElementById('productSalesChart').getContext('2d');

    // Destruir el gráfico existente si ya existe
    if (productSalesChart) {
        productSalesChart.destroy();
    }

    productSalesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Cantidad Vendida',
                    data: salesData,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cantidad Vendida'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Productos'
                    }
                }
            }
        }
    });
}

let financialChart;

function fetchFinancialData(startDate, endDate) {
    console.log(`Buscando datos financieros desde ${startDate} hasta ${endDate}`);

    const start = new Date(startDate).setHours(0, 0, 0, 0); // Inicio del día
    const end = new Date(endDate).setHours(23, 59, 59, 999); // Fin del día

    let totalSalesData = {};
    let cajaData = {};
    let gastoData = {};

    // Generar un arreglo de todas las fechas en el rango seleccionado
    let currentDate = new Date(start);
    while (currentDate <= new Date(end)) {
        const formattedDate = currentDate.toISOString().split('T')[0];
        totalSalesData[formattedDate] = 0;
        cajaData[formattedDate] = 0;
        gastoData[formattedDate] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Consulta de la colección visits para obtener las ventas
    db.collection('visits')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const visit = doc.data();
                const date = visit.date;
                if (!totalSalesData[date]) {
                    totalSalesData[date] = 0;
                }
                totalSalesData[date] += visit.totalSales;
            });
            console.log('Datos obtenidos de visitas:', totalSalesData);
        })
        .catch((error) => {
            console.error('Error obteniendo datos de ventas:', error);
        });

    // Consulta de la colección caja
    db.collection('caja')
        .where('fecha', '>=', new Date(start))
        .where('fecha', '<=', new Date(end))
        .get()
        .then((querySnapshot) => {
            console.log("Documentos obtenidos de caja:", querySnapshot.docs);
            querySnapshot.forEach((doc) => {
                const caja = doc.data();
                console.log("Datos individuales de caja:", caja);
                const date = caja.fecha.toDate().toISOString().split('T')[0];
                if (!cajaData[date]) {
                    cajaData[date] = 0;
                }
                cajaData[date] += caja.total;
            });
            console.log('Datos obtenidos de caja:', cajaData);
        })
        .catch((error) => {
            console.error('Error obteniendo datos de caja:', error);
        });

    // Consulta de la colección Gasto
    db.collection('Gasto')
    .get()
    .then((querySnapshot) => {
        console.log("Documentos obtenidos de Gasto:", querySnapshot.docs);
        querySnapshot.forEach((doc) => {
            const gasto = doc.data();
            console.log("Datos individuales de gasto:", gasto);

            let parsedDate;
            if (typeof gasto.fecha === 'string') {
                // Si es una cadena, dividimos como antes
                const dateParts = gasto.fecha.split(', ')[0].split('/');
                const month = dateParts[0] - 1; // Los meses en JavaScript son base 0
                const day = dateParts[1];
                const year = dateParts[2];
                parsedDate = new Date(year, month, day);
            } else if (gasto.fecha instanceof firebase.firestore.Timestamp) {
                // Si es un Timestamp, lo convertimos a Date
                parsedDate = gasto.fecha.toDate();
            } else {
                console.error('Formato de fecha no reconocido:', gasto.fecha);
                return;
            }

            // Comparar las fechas
            if (parsedDate >= new Date(start) && parsedDate <= new Date(end)) {
                const formattedDate = parsedDate.toISOString().split('T')[0];
                if (!gastoData[formattedDate]) {
                    gastoData[formattedDate] = 0;
                }
                gastoData[formattedDate] += gasto.TotalgastoDia;
            }
        });
        console.log('Datos obtenidos de gastos:', gastoData);

        // Preparación de los datos para el gráfico
        const labels = Object.keys(totalSalesData).sort();
        const totalSalesValues = labels.map(date => totalSalesData[date] || 0);
        const cajaValues = labels.map(date => cajaData[date] || 0);
        const gastoValues = labels.map(date => gastoData[date] || 0);

        renderFinancialChart(labels, totalSalesValues, cajaValues, gastoValues);
    })
    .catch((error) => {
        console.error('Error obteniendo datos de gastos:', error);
    });
}


function renderFinancialChart(labels, totalSalesData, cajaData, gastoData) {
    // Formatear las etiquetas con el día de la semana sin el año
    const formattedLabels = labels.map(date => getDayName(date));
    
    const ctx = document.getElementById('finanzafinChart').getContext('2d');

    if (financialChart) {
        financialChart.destroy();
    }

    financialChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: 'Total de Ventas',
                    data: totalSalesData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: false
                },
                {
                    label: 'Total en Caja',
                    data: cajaData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false
                },
                {
                    label: 'Total de Gastos',
                    data: gastoData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);

    const startDate = fiveDaysAgo.toISOString().split('T')[0];
    const endDate = getCurrentDateFormatted();

    fetchFinancialData(startDate, endDate);

    document.getElementById('finanzafinFetchBtn').addEventListener('click', function() {
        const startDate = document.getElementById('finanzafinStartDate').value;
        const endDate = document.getElementById('finanzafinEndDate').value;
        fetchFinancialData(startDate, endDate);
    });
});
function getDayName(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}
