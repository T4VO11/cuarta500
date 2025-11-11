const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Esta función crea una configuración de Multer para una subcarpeta específica.
 * @param {string} subfolder - El nombre de la subcarpeta dentro de 'uploads' donde se guardarán los archivos.
 * @returns {multer} - Una instancia de Multer configurada.
 */
const createUploader = (subfolder) => {
  // 1. Configuración de almacenamiento (Storage)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Creamos la ruta completa al directorio de destino
      const dir = path.join(__dirname, `uploads/${subfolder}`);

      // Verificamos si la carpeta existe, si no, la creamos
      // { recursive: true } asegura que se creen las carpetas anidadas si es necesario
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      // Mantenemos tu lógica para nombrar archivos
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  });

  // 2. Filtro de archivos (opcional, pero recomendado)
  const fileFilter = (req, file, cb) => {
    const tipos = /jpeg|jpg|png|gif|webp/;
    const mimetype = tipos.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes de tipo jpeg, jpg, png, gif o webp'));
    }
  };

  // 3. Devolvemos la instancia de Multer configurada
  // limits: permite controlar el tamaño de los archivos
  const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
  });
  
  return upload;
};

module.exports = createUploader;
