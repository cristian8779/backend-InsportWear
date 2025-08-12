// utils/externalServices.js
const axios = require('axios');

// 🔗 Obtener productos desde microservicio
const obtenerProductos = async () => {
    try {
        const response = await axios.get(`${process.env.PRODUCTO_SERVICE_URL}/api/productos`, {
            timeout: 5000, // 5 segundos timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ [Productos] Conexión exitosa al microservicio');
        
        // 🔍 Debug: ver qué estructura devuelve
        console.log('📊 [Productos] Tipo de respuesta:', typeof response.data);
        console.log('📊 [Productos] Estructura recibida:', Object.keys(response.data || {}));
        
        let productos = [];
        
        // 🔧 Manejar diferentes formatos de respuesta
        if (Array.isArray(response.data)) {
            // Formato: [productos...]
            productos = response.data;
        } else if (response.data && Array.isArray(response.data.productos)) {
            // Formato: { productos: [productos...] }
            productos = response.data.productos;
        } else if (response.data && Array.isArray(response.data.data)) {
            // Formato: { data: [productos...] }
            productos = response.data.data;
        } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
            // Formato: { items: [productos...] }
            productos = response.data.items;
        } else {
            console.warn('⚠️ [Productos] Formato de respuesta no reconocido:', response.data);
            productos = [];
        }

        console.log(`✅ [Productos] Respuesta procesada (${productos.length} items)`);
        return productos;

    } catch (error) {
        console.error('❌ [Productos] Error al conectar con microservicio:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔌 [Productos] Microservicio no disponible en:', process.env.PRODUCTO_SERVICE_URL);
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️ [Productos] Timeout al conectar con microservicio');
        }
        
        // Devolver array vacío en caso de error para evitar crashes
        return [];
    }
};

// 🔗 Obtener categorías desde microservicio
const obtenerCategorias = async () => {
    try {
        const response = await axios.get(`${process.env.CATEGORIA_SERVICE_URL}/api/categorias`, {
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ [Categorías] Conexión exitosa al microservicio');
        
        // 🔍 Debug: ver qué estructura devuelve
        console.log('📊 [Categorías] Tipo de respuesta:', typeof response.data);
        console.log('📊 [Categorías] Estructura recibida:', Object.keys(response.data || {}));
        
        let categorias = [];
        
        // 🔧 Manejar diferentes formatos de respuesta
        if (Array.isArray(response.data)) {
            // Formato: [categorias...]
            categorias = response.data;
        } else if (response.data && Array.isArray(response.data.categorias)) {
            // Formato: { categorias: [categorias...] }
            categorias = response.data.categorias;
        } else if (response.data && Array.isArray(response.data.data)) {
            // Formato: { data: [categorias...] }
            categorias = response.data.data;
        } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
            // Formato: { items: [categorias...] }
            categorias = response.data.items;
        } else {
            console.warn('⚠️ [Categorías] Formato de respuesta no reconocido:', response.data);
            categorias = [];
        }

        console.log(`✅ [Categorías] Respuesta procesada (${categorias.length} items)`);
        return categorias;

    } catch (error) {
        console.error('❌ [Categorías] Error al conectar con microservicio:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('🔌 [Categorías] Microservicio no disponible en:', process.env.CATEGORIA_SERVICE_URL);
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️ [Categorías] Timeout al conectar con microservicio');
        }
        
        // Devolver array vacío en caso de error para evitar crashes
        return [];
    }
};

// 🧪 Función de prueba para verificar microservicios
const probarMicroservicios = async () => {
    console.log('🧪 Probando conexión a microservicios...');
    
    try {
        const [productos, categorias] = await Promise.all([
            obtenerProductos(),
            obtenerCategorias()
        ]);
        
        console.log(`📊 Productos disponibles: ${productos.length}`);
        console.log(`📊 Categorías disponibles: ${categorias.length}`);
        
        // Mostrar algunos ejemplos si hay datos
        if (productos.length > 0) {
            console.log('📦 Ejemplo de producto:', {
                id: productos[0]._id || productos[0].id,
                nombre: productos[0].nombre || productos[0].name || 'Sin nombre'
            });
        }
        
        if (categorias.length > 0) {
            console.log('📁 Ejemplo de categoría:', {
                id: categorias[0]._id || categorias[0].id,
                nombre: categorias[0].nombre || categorias[0].name || 'Sin nombre'
            });
        }
        
    } catch (error) {
        console.error('❌ Error al probar microservicios:', error.message);
    }
};

module.exports = {
    obtenerProductos,
    obtenerCategorias,
    probarMicroservicios
};