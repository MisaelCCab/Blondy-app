const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Abril2005@@',
  database: process.env.DB_NAME || 'BlondyDB'
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Crear tabla de progreso si no existe
const createProgressTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS user_progress_BL (
      progressID INT PRIMARY KEY AUTO_INCREMENT,
      userID INT NOT NULL,
      exerciseType VARCHAR(50) NOT NULL,
      duration INT,
      roundsCompleted INT,
      score INT,
      dateCompleted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `;
  
  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creando tabla de progreso:', err);
    } else {
      console.log('Tabla de progreso verificada/creada exitosamente');
    }
  });
};

// Llamar a la función al iniciar el servidor
createProgressTable();

// REGISTER
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, email y contraseña son requeridos' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.query(
      `INSERT INTO usuers_BL (usNombreComp, usEmail, usPsw) 
       VALUES (?, ?, ?)`,
      [name, email, hashedPassword],
      (err, results) => {
        if (err) {
          console.error('Error creando usuario:', err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
              success: false, 
              message: 'El email ya está registrado' 
            });
          }
          return res.status(500).json({ 
            success: false, 
            message: 'Error creando usuario', 
            error: err.message 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Usuario creado exitosamente',
          user: {
            id: results.insertId,
            name: name,
            email: email
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor', 
      error: error.message 
    });
  }
});

// LOGIN (acepta email o username)
app.post('/login', (req, res) => {
  const { username, email, password } = req.body;
  
  if ((!username && !email) || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Usuario/Email y contraseña son requeridos' 
    });
  }
  
  const queryField = username ? 'usNombreComp' : 'usEmail';
  const queryValue = username || email;
  
  db.query(`SELECT * FROM usuers_BL WHERE ${queryField} = ?`, [queryValue], async (err, results) => {
    if (err) {
      console.error('Error en login:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error del servidor', 
        error: err.message 
      });
    }
    
    if (results.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    const user = results[0];
    
    const validPassword = await bcrypt.compare(password, user.usPsw);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contraseña incorrecta' 
      });
    }
    
    const token = jwt.sign({ 
      userId: user.usID,
      userEmail: user.usEmail
    }, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });
    
    res.json({ 
      success: true, 
      message: 'Login exitoso',
      token,
      user: { 
        id: user.usID, 
        name: user.usNombreComp,
        email: user.usEmail
      }
    });
  });
});

// PROGRESS - Guardar progreso de ejercicios
app.post('/progress', (req, res) => {
  console.log('Recibiendo datos de progreso:', req.body);
  
  const { userId, exerciseType, duration, roundsCompleted, score } = req.body;
  
  // Validar campos requeridos
  if (!userId || !exerciseType) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId y exerciseType son requeridos' 
    });
  }
  
  db.query(
    `INSERT INTO user_progress_BL (userID, exerciseType, duration, roundsCompleted, score) 
     VALUES (?, ?, ?, ?, ?)`,
    [userId, exerciseType, duration || 0, roundsCompleted || 0, score || 0],
    (err, results) => {
      if (err) {
        console.error('Error guardando progreso:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        progressId: results.insertId,
        message: 'Progreso guardado exitosamente'
      });
    }
  );
});

// Obtener estadísticas de progreso
app.get('/progress/stats/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.query(
    `SELECT 
        exerciseType,
        COUNT(*) as totalSessions,
        SUM(duration) as totalTime,
        SUM(roundsCompleted) as totalRounds,
        AVG(score) as averageScore,
        MAX(dateCompleted) as lastSession
     FROM user_progress_BL 
     WHERE userID = ? 
     GROUP BY exerciseType`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo estadísticas:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        stats: results 
      });
    }
  );
});

// RUTAS PARA EJERCICIOS VOCALES

// Guardar progreso de ejercicio vocal
app.post('/vocal-exercises/progress', (req, res) => {
  console.log('Recibiendo progreso de ejercicio vocal:', req.body);
  
  const { userId, weekNumber, challengeId, status } = req.body;
  
  if (!userId || !weekNumber || !challengeId || !status) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId, weekNumber, challengeId y status son requeridos' 
    });
  }
  
  // Determinar las fechas según el estado
  const startDate = status === 'in_progress' || status === 'completed' ? new Date() : null;
  const completionDate = status === 'completed' ? new Date() : null;
  
  db.query(
    `INSERT INTO vocal_exercises_progress 
     (userID, week_number, challenge_id, status, start_date, completion_date) 
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     status = VALUES(status),
     start_date = COALESCE(VALUES(start_date), start_date),
     completion_date = COALESCE(VALUES(completion_date), completion_date),
     updated_at = CURRENT_TIMESTAMP`,
    [userId, weekNumber, challengeId, status, startDate, completionDate],
    (err, results) => {
      if (err) {
        console.error('Error guardando progreso de ejercicio vocal:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        message: 'Progreso de ejercicio vocal guardado exitosamente',
        progressId: results.insertId
      });
    }
  );
});

// Obtener progreso de ejercicios vocales por usuario
app.get('/vocal-exercises/progress/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.query(
    `SELECT 
        week_number,
        challenge_id,
        status,
        start_date,
        completion_date
     FROM vocal_exercises_progress 
     WHERE userID = ? 
     ORDER BY week_number ASC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo progreso de ejercicios vocales:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        progress: results 
      });
    }
  );
});

// Obtener estadísticas de ejercicios vocales
app.get('/vocal-exercises/stats/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.query(
    `SELECT 
        COUNT(*) as total_challenges,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_challenges,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_challenges,
        MAX(completion_date) as last_completion
     FROM vocal_exercises_progress 
     WHERE userID = ?`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo estadísticas de ejercicios vocales:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        stats: results[0] 
      });
    }
  );
});

// Obtener todos los datos de progreso combinados
app.get('/progress/all/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Obtener progreso de ejercicios regulares
    const exercisesPromise = new Promise((resolve, reject) => {
      db.query(
        `SELECT 
            exerciseType,
            COUNT(*) as totalSessions,
            SUM(duration) as totalTime,
            SUM(roundsCompleted) as totalRounds,
            AVG(score) as averageScore,
            MAX(dateCompleted) as lastSession
         FROM user_progress_BL 
         WHERE userID = ? 
         GROUP BY exerciseType`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Obtener progreso de ejercicios vocales
    const vocalExercisesPromise = new Promise((resolve, reject) => {
      db.query(
        `SELECT 
            week_number,
            challenge_id,
            status,
            start_date,
            completion_date
         FROM vocal_exercises_progress 
         WHERE userID = ? 
         ORDER BY week_number ASC`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Obtener estadísticas de ejercicios vocales
    const vocalStatsPromise = new Promise((resolve, reject) => {
      db.query(
        `SELECT 
            COUNT(*) as total_challenges,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_challenges,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_challenges,
            MAX(completion_date) as last_completion
         FROM vocal_exercises_progress 
         WHERE userID = ?`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });

    const [exercises, vocalExercises, vocalStats] = await Promise.all([
      exercisesPromise,
      vocalExercisesPromise,
      vocalStatsPromise
    ]);

    res.json({
      success: true,
      data: {
        exercises,
        vocalExercises,
        stats: {
          vocal: vocalStats
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo progreso combinado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// RUTAS PARA RETOS DE HABLA

// Obtener retos del usuario
app.get('/speech-challenges/:userId', (req, res) => {
  const userId = req.params.userId;
  
  db.query(
    `SELECT * FROM speech_challenges 
     WHERE userID = ? 
     ORDER BY challenge_level, assigned_date DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('Error obteniendo retos de habla:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      res.json({ 
        success: true, 
        challenges: results 
      });
    }
  );
});

// Asignar nuevo reto diario
app.post('/speech-challenges/assign-daily', (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId es requerido' 
    });
  }

  // Verificar si ya tiene un reto asignado para hoy
  const today = new Date().toISOString().split('T')[0];
  
  db.query(
    `SELECT COUNT(*) as count FROM speech_challenges 
     WHERE userID = ? AND assigned_date = ? AND status IN ('pending', 'in_progress')`,
    [userId, today],
    (err, results) => {
      if (err) {
        console.error('Error verificando retos del día:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      
      if (results[0].count > 0) {
        return res.json({ 
          success: true, 
          message: 'Ya tienes un reto asignado para hoy',
          alreadyAssigned: true 
        });
      }
      
      // Obtener el nivel actual del usuario
      db.query(
        `SELECT MAX(challenge_level) as max_level FROM speech_challenges 
         WHERE userID = ? AND status = 'completed'`,
        [userId],
        (err, levelResults) => {
          if (err) {
            console.error('Error obteniendo nivel del usuario:', err);
            return res.status(500).json({ 
              success: false, 
              error: err.message 
            });
          }
          
          const currentLevel = levelResults[0].max_level || 1;
          const availableChallenges = speechChallengesData.filter(challenge => 
            challenge.level === currentLevel
          );
          
          if (availableChallenges.length === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'No hay retos disponibles para este nivel' 
            });
          }
          
          // Seleccionar un reto aleatorio
          const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
          
          // Insertar el reto
          db.query(
            `INSERT INTO speech_challenges 
             (userID, challenge_level, challenge_title, challenge_description, challenge_type, assigned_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, currentLevel, randomChallenge.title, randomChallenge.description, randomChallenge.type, today],
            (err, insertResults) => {
              if (err) {
                console.error('Error asignando reto:', err);
                return res.status(500).json({ 
                  success: false, 
                  error: err.message 
                });
              }
              
              res.json({ 
                success: true, 
                challenge: {
                  id: insertResults.insertId,
                  ...randomChallenge,
                  assigned_date: today
                },
                message: 'Nuevo reto asignado para hoy'
              });
            }
          );
        }
      );
    }
  );
});

// Actualizar estado del reto
app.put('/speech-challenges/:challengeId', (req, res) => {
  const challengeId = req.params.challengeId;
  const { status, notes } = req.body;
  
  if (!status) {
    return res.status(400).json({ 
      success: false, 
      error: 'status es requerido' 
    });
  }
  
  const completionDate = status === 'completed' ? new Date() : null;
  
  db.query(
    `UPDATE speech_challenges 
     SET status = ?, completed_date = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [status, completionDate, challengeId],
    (err, results) => {
      if (err) {
        console.error('Error actualizando reto:', err);
        return res.status(500).json({ 
          success: false, 
          error: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Reto actualizado exitosamente'
      });
    }
  );
});

// Datos de los retos (agregar al servidor)
const speechChallengesData = [
  // NIVEL 1: Romper el Hielo
  {
    level: 1,
    title: "El Saludo Diario",
    description: "Saluda con contacto visual y una ligera sonrisa a una persona con la que normalmente no interactúas",
    type: "non_verbal",
    duration: "1 día",
    difficulty: "Baja"
  },
  {
    level: 1,
    title: "El Pequeño Desvío",
    description: "Modifica ligeramente una rutina diaria (camino diferente, pedir café diferente)",
    type: "non_verbal",
    duration: "1 día",
    difficulty: "Baja"
  },
  {
    level: 1,
    title: "Contacto Visual Sostenido",
    description: "Mantén contacto visual durante el 70% de una interacción breve",
    type: "non_verbal",
    duration: "1 día",
    difficulty: "Media"
  },
  
  // NIVEL 2: Interacciones Breves
  {
    level: 2,
    title: "La Pregunta de Servicio",
    description: "Haz una pregunta de seguimiento a un empleado de servicio",
    type: "verbal_short",
    duration: "1 día",
    difficulty: "Media"
  },
  {
    level: 2,
    title: "El Elogio Genuino",
    description: "Haz un cumplido sincero a una persona desconocida",
    type: "verbal_short",
    duration: "1 día",
    difficulty: "Media"
  },
  {
    level: 2,
    title: "El 'Por Favor' Ampliado",
    description: "Añade un pequeño detalle personal cuando pidas algo",
    type: "verbal_short",
    duration: "1 día",
    difficulty: "Media"
  },
  
  // NIVEL 3: Compromiso a Largo Plazo
  {
    level: 3,
    title: "Clases o Clubes con Interés",
    description: "Apúntate a un curso o club sobre algo que te interese",
    type: "long_term",
    duration: "7 días",
    difficulty: "Alta"
  },
  {
    level: 3,
    title: "El 'Escucha Activa' Extrema",
    description: "Concéntrate al 100% en lo que dice alguien y haz preguntas de seguimiento",
    type: "long_term",
    duration: "3 días",
    difficulty: "Alta"
  }
];

// HEALTH CHECK
app.get('/health', (req, res) => {
  db.query('SELECT 1', (err) => {
    if (err) {
      return res.status(500).json({ 
        status: 'ERROR', 
        message: 'Error de conexión a la base de datos', 
        error: err.message 
      });
    }
    res.json({ 
      status: 'OK', 
      message: 'Servidor y base de datos funcionando correctamente' 
    });
  });
});

// Ruta para crear tabla manualmente (por si acaso)
app.get('/create-progress-table', (req, res) => {
  createProgressTable();
  res.json({ 
    success: true, 
    message: 'Tabla de progreso creada/verificada exitosamente' 
  });
});

const createVocalExercisesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS vocal_exercises_progress (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userID INT NOT NULL,
      week_number INT NOT NULL,
      challenge_id INT NOT NULL,
      status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
      start_date TIMESTAMP NULL,
      completion_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_week (userID, week_number)
    )
  `;
  
  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creando tabla de ejercicios vocales:', err);
    } else {
      console.log('Tabla de ejercicios vocales verificada/creada exitosamente');
    }
  });
};

// Llamar esta función al iniciar el servidor
createVocalExercisesTable();

const createSpeechChallengesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS speech_challenges (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userID INT NOT NULL,
      challenge_level INT NOT NULL,
      challenge_title VARCHAR(255) NOT NULL,
      challenge_description TEXT,
      challenge_type VARCHAR(50),
      status ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',
      assigned_date DATE,
      completed_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableQuery, (err, results) => {
    if (err) {
      console.error('Error creando tabla de retos de habla:', err);
    } else {
      console.log('Tabla de retos de habla verificada/creada exitosamente');
    }
  });
};

// Llamar esta función al iniciar el servidor
createSpeechChallengesTable();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});