// 假设数据库名为 'myDatabase'，对象存储名为 'myStore'
const dbName = 'keyval-store';
const storeName = 'keyval';

// 打开 IndexedDB 数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 从对象存储中读取所有数据
async function getAllData() {
  const db: any = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const data: any = [];
    
    // 使用游标分批读取数据
    store.openCursor().onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        data.push(cursor.value);
        cursor.continue();
      } else {
        resolve(data[data.length-1]);
      }
    };
    
    transaction.onerror = () => reject(transaction.error);
  });
}

// 将数据导出为 JSON 文件并下载
export async function exportToJsonFile() {
  try {
    // 获取数据
    const data = await getAllData();
    
    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(data, null, 2);
    
    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'indexedDB_data.json'; // 下载文件名
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('数据导出成功！');
  } catch (error) {
    console.error('导出失败：', error);
  }
}
