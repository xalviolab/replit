const fs = require('fs').promises;
const path = require('path');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  try {
    // Admin kullanıcı bilgileri
    const adminUser = {
      id: 1,
      username: "admin",
      email: "admin@cardioedu.com",
      password: await hashPassword("admin123"),  // Gerçek uygulamada daha güçlü bir şifre kullanılmalı
      full_name: "Admin User",
      is_active: true,
      role_id: 1,  // Admin rolü
      created_at: new Date().toISOString(),
      updated_at: null,
      reset_token: null,
      reset_token_expires: null
    };

    // Standart kullanıcı
    const regularUser = {
      id: 2,
      username: "user",
      email: "user@cardioedu.com",
      password: await hashPassword("user123"),  // Gerçek uygulamada daha güçlü bir şifre kullanılmalı
      full_name: "Regular User",
      is_active: true,
      role_id: 2,  // Normal kullanıcı rolü
      created_at: new Date().toISOString(),
      updated_at: null,
      reset_token: null,
      reset_token_expires: null
    };

    // Kullanıcıları dosyaya yazalım
    const usersFilePath = path.join(process.cwd(), 'data/users.json');
    
    // Klasörü oluştur
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    
    // Kullanıcıları kaydet
    await fs.writeFile(usersFilePath, JSON.stringify([adminUser, regularUser], null, 2), 'utf-8');
    
    console.log('Admin ve düzenli kullanıcı başarıyla oluşturuldu!');
    console.log(`Dosya kaydedildi: ${usersFilePath}`);
    console.log('\nGiriş Bilgileri:');
    console.log('Admin: admin@cardioedu.com / admin123');
    console.log('Kullanıcı: user@cardioedu.com / user123');
  } catch (error) {
    console.error('Hata:', error);
  }
}

main();