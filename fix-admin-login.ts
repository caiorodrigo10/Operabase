import { postgresStorage } from './server/postgres-storage';
import bcrypt from 'bcryptjs';

async function fixAdminLogin() {
  try {
    console.log('🔧 Fixing admin login...');
    
    // Hash the password using the same method as the application
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Generated hash:', hashedPassword);
    
    // Update using the application's ORM to ensure consistency
    const updatedUser = await postgresStorage.updateUser(2, {
      password: hashedPassword,
      name: 'Administrador Sistema',
      role: 'super_admin'
    });
    
    console.log('✅ User updated:', updatedUser ? 'Success' : 'Failed');
    
    // Test the password immediately
    const testUser = await postgresStorage.getUserByEmail('admin@teste.com');
    if (testUser) {
      const isValid = await bcrypt.compare('admin123', testUser.password);
      console.log('🧪 Password test result:', isValid);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAdminLogin();