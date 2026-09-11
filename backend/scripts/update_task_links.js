import { hrmsPool } from '../db/pool.js';

async function update() {
  await hrmsPool.query(
    `UPDATE tasks 
     SET reference_link = $1, video_url = $2 
     WHERE id = $3`,
    ['http://localhost:3000/employee/tasks', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'TSK-MTV86WGG-479']
  );
  console.log('✅ Updated task TSK-MTV86WGG-479 with reference_link and video_url');
  process.exit(0);
}

update();
