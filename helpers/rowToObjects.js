export function rowToUser(row) {
    return {
        id: row[0],
        name: row[1],
        email: row[2],
        phone: row[3],
    };
}

export function rowToProduct(row) {
    return {
        id: row[0],
        name: row[1],
        description: row[2],
        price: row[3],
        stock: row[4],
        category: row[5],
    };
}