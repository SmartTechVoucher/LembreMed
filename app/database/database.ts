import * as SQLite from 'expo-sqlite';

export interface User {
  id: number;
  email: string;
  name: string | null;
  profile_image: string | null;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  notification_enabled: number;
  notification_id: string | null;
  taken_today: number;
  created_at: string;
}

const db = SQLite.openDatabaseSync('lembremed_v4.db');

export const migrateDatabase = async (): Promise<void> => {
  try {
    try {
      await db.execAsync(`
        ALTER TABLE medications ADD COLUMN notification_id TEXT;
      `);
      console.log('✅ Coluna notification_id adicionada');
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        console.log('✅ Coluna notification_id já existe');
      }
    }

    try {
      await db.execAsync(`
        ALTER TABLE medications ADD COLUMN taken_today INTEGER DEFAULT 0;
      `);
      console.log('✅ Coluna taken_today adicionada');
    } catch (error: any) {
      if (error.message.includes('duplicate column')) {
        console.log('✅ Coluna taken_today já existe');
      }
    }
  } catch (error) {
    console.error('❌ Erro na migração de colunas:', error);
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        dosage TEXT,
        frequency TEXT,
        time TEXT,
        instructions TEXT,
        start_date TEXT,
        end_date TEXT,
        notification_enabled INTEGER DEFAULT 1,
        notification_id TEXT,
        taken_today INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);

    await createMedicationHistoryTable();
    await migrateDatabase();

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
};

export const registerUser = async (
  email: string,
  password: string,
  name?: string,
  profileImage?: string
): Promise<{ success: boolean; userId?: number; error?: string }> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO users (email, password, name, profile_image) VALUES (?, ?, ?, ?)',
      [email, password, name || null, profileImage || null]
    );

    console.log('👤 User registered successfully with ID:', result.lastInsertRowId);
    return { success: true, userId: result.lastInsertRowId };
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Este e-mail já está cadastrado' };
    }
    console.error('Error registering user:', error);
    return { success: false, error: 'Erro ao cadastrar usuário' };
  }
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const result = await db.getFirstAsync<User>(
      'SELECT id, email, name, profile_image FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (result) {
      console.log('🔐 Login successful:', result);
      return { success: true, user: result };
    } else {
      return { success: false, error: 'E-mail ou senha incorretos' };
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const result = await db.getFirstAsync<User>(
      'SELECT id, email, name, profile_image FROM users WHERE id = ?',
      [id]
    );
    return result || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: number,
  newEmail?: string,
  newPassword?: string,
  newProfileImage?: string 
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    if (newEmail) {
      updateFields.push('email = ?');
      updateValues.push(newEmail);
    }
    
    if (newPassword) {
      updateFields.push('password = ?');
      updateValues.push(newPassword);
    }

    if (newProfileImage !== undefined) {
      updateFields.push('profile_image = ?');
      const imageValue = newProfileImage.trim() === '' ? null : newProfileImage;
      updateValues.push(imageValue);
    }

    if (updateFields.length === 0) {
      return { success: true }; 
    }

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    await db.runAsync(sql, updateValues);
    console.log('✅ Usuário atualizado com sucesso.');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Este e-mail já está cadastrado' };
    }
    console.error('❌ Erro ao atualizar usuário:', error);
    return { success: false, error: 'Erro ao atualizar dados do usuário' };
  }
};

export const addMedication = async (
  userId: number,
  name: string,
  dosage: string,
  frequency: string,
  time: string,
  instructions?: string,
  startDate?: string,
  endDate?: string,
  notificationId?: string
): Promise<{ success: boolean; medicationId?: number; error?: string }> => {
  try {
    const result = await db.runAsync(
      `INSERT INTO medications (
        user_id, name, dosage, frequency, time, instructions, start_date, end_date, notification_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        dosage,
        frequency,
        time,
        instructions || null,
        startDate || null,
        endDate || null,
        notificationId || null,
      ]
    );

    console.log('💊 Medication added successfully with ID:', result.lastInsertRowId);
    return { success: true, medicationId: result.lastInsertRowId };
  } catch (error) {
    console.error('Error adding medication:', error);
    return { success: false, error: 'Erro ao adicionar medicamento' };
  }
};

export const getUserMedications = async (userId: number): Promise<Medication[]> => {
  try {
    const result = await db.getAllAsync<Medication>(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY time ASC',
      [userId]
    );

    return result || [];
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

export const deleteMedication = async (
  medicationId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.runAsync('DELETE FROM medications WHERE id = ?', [medicationId]);
    console.log('🗑️ Medication deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting medication:', error);
    return { success: false, error: 'Erro ao deletar medicamento' };
  }
};

export const getMedicationNotificationId = async (
  medicationId: number
): Promise<string | null> => {
  try {
    const result = await db.getFirstAsync<{ notification_id: string }>(
      'SELECT notification_id FROM medications WHERE id = ?',
      [medicationId]
    );
    return result?.notification_id || null;
  } catch (error) {
    console.error('Error getting notification_id:', error);
    return null;
  }
};

export const updateMedication = async (
  medicationId: number,
  name: string,
  dosage: string,
  frequency: string,
  time: string,
  instructions?: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.runAsync(
      `UPDATE medications
        SET name = ?, dosage = ?, frequency = ?, time = ?, instructions = ?, start_date = ?, end_date = ?
        WHERE id = ?`,
      [
        name,
        dosage,
        frequency,
        time,
        instructions || null,
        startDate || null,
        endDate || null,
        medicationId,
      ]
    );
    console.log('💊 Medication updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating medication:', error);
    return { success: false, error: 'Erro ao atualizar medicamento' };
  }
};

export const markMedicationAsTaken = async (
  medicationId: number,
  taken: boolean,
  userId: number,
  medicationName: string,
  dosage: string,
  scheduledTime: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.runAsync(
      'UPDATE medications SET taken_today = ? WHERE id = ?',
      [taken ? 1 : 0, medicationId]
    );

    if (taken) {
      await addToHistory(medicationId, userId, medicationName, dosage, scheduledTime, 'taken');
    }

    console.log(`✅ Medication ${taken ? 'marcado como tomado' : 'desmarcado'}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating taken status:', error);
    return { success: false, error: 'Erro ao atualizar status' };
  }
};

export const resetDailyMedications = async (): Promise<void> => {
  try {
    await db.runAsync('UPDATE medications SET taken_today = 0');
    console.log('🔄 Medicamentos resetados para o novo dia');
  } catch (error) {
    console.error('Error resetting medications:', error);
  }
};

export const createMedicationHistoryTable = async (): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS medication_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        medication_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        medication_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        taken_time TEXT,
        status TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (medication_id) REFERENCES medications (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
    console.log('✅ Tabela medication_history criada');
  } catch (error) {
    console.error('❌ Erro ao criar tabela de histórico:', error);
  }
};

export const addToHistory = async (
  medicationId: number,
  userId: number,
  medicationName: string,
  dosage: string,
  scheduledTime: string,
  status: 'taken' | 'missed'
): Promise<void> => {
  try {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const takenTime = status === 'taken' ? now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }) : null;

    await db.runAsync(
      `INSERT INTO medication_history 
        (medication_id, user_id, medication_name, dosage, scheduled_time, taken_time, status, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicationId, userId, medicationName, dosage, scheduledTime, takenTime, status, date]
    );

    console.log(`📝 Histórico registrado: ${medicationName} - ${status}`);
  } catch (error) {
    console.error('❌ Erro ao adicionar histórico:', error);
  }
};

export const getMedicationHistory = async (
  userId: number,
  limit: number = 50
): Promise<any[]> => {
  try {
    const result = await db.getAllAsync(
      `SELECT * FROM medication_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?`,
      [userId, limit]
    );

    return result || [];
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return [];
  }
};

export const getHistoryByDate = async (
  userId: number,
  date: string
): Promise<any[]> => {
  try {
    const result = await db.getAllAsync(
      `SELECT * FROM medication_history 
        WHERE user_id = ? AND date = ? 
        ORDER BY scheduled_time ASC`,
      [userId, date]
    );

    return result || [];
  } catch (error) {
    console.error('❌ Erro ao buscar histórico por data:', error);
    return [];
  }
};

export const getHistoryStats = async (userId: number): Promise<{
  total: number;
  taken: number;
  missed: number;
  percentage: number;
}> => {
  try {
    const totalResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM medication_history WHERE user_id = ?',
      [userId]
    );

    const takenResult = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM medication_history WHERE user_id = ? AND status = 'taken'",
      [userId]
    );

    const total = totalResult?.count || 0;
    const taken = takenResult?.count || 0;
    const missed = total - taken;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

    return { total, taken, missed, percentage };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return { total: 0, taken: 0, missed: 0, percentage: 0 };
  }
};

export const getAllMedicationsByUser = async (userId: number): Promise<Medication[]> => {
  try {
    const result = await db.getAllAsync<Medication>(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY time ASC',
      [userId]
    );

    console.log(`📋 ${result?.length || 0} medicamento(s) encontrado(s) para usuário ${userId}`);
    return result || [];
  } catch (error) {
    console.error('❌ Erro ao buscar medicamentos do usuário:', error);
    return [];
  }
};

export const updateMedicationAlarmId = async (
  medicationId: number,
  alarmId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await db.runAsync(
      'UPDATE medications SET notification_id = ? WHERE id = ?',
      [alarmId, medicationId]
    );
    
    console.log(`✅ alarm_id atualizado para medicamento ${medicationId}: ${alarmId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao atualizar alarm_id:', error);
    return { success: false, error: 'Erro ao atualizar ID do alarme' };
  }
};

export default db;
