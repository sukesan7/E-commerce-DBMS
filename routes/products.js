import { Router } from 'express';
import { rowToProduct } from '../helpers/rowToObjects.js';
const router = Router();

// Product routes
router.get('/getAll', (req, res) => {
    req.db.execute(`SELECT * FROM products`).then((result) => {
        if (result.rows.length > 0) {
            const products = result.rows.map(rowToProduct);
            res.status(200).json(products);
        } else {
            res.status(404).send('No products found');
        }
    }).catch((err) => {
        console.error(err);
        res.status(500).send('Error getting products');
    });
});

router.post('/add', async (req, res) => {
    if (!req.session.isAdmin) return res.status(403).send('Permission denied');

    const { name, price, description, stock, category, brand } = req.body;
    const { id } = req.session.user;

    let [product_id] = (await req.db.execute(`SELECT MAX(product_id) FROM products`)).rows.map(row => row[0]); // get the max product_id from products table
    product_id = `P${parseInt(product_id.slice(1)) + 1}`; // increment the product_id by 1

    let brand_id = (await req.db.execute(`SELECT brand_id FROM brands WHERE name = '${brand}'`)).rows; // get the brand_id from brands table
    let brandExists = brand_id.length > 0; // check if brand exists

    if (brand_id.length === 0) brand_id = `B${parseInt((await req.db.execute(`SELECT MAX(brand_id) FROM brands`)).rows[0][0].slice(1))}`; // get the max brand_id from brands table
    else brand_id = brand_id[0][0]; // get the brand_id from brands table

    req.db.execute(`INSERT ALL
        INTO products (product_id, product_name, price, description, stock, category) VALUES ('${product_id}', '${name}', '${price}', '${description}', '${stock}', '${category}')
        INTO productaddition (product_id, admin_id, date_added) VALUES ('${product_id}', '${id}', SYSDATE)
        INTO productmanage (product_id, admin_id) VALUES ('${product_id}', '${id}')
        ${brandExists ?
            '' :
            `INTO brands (brand_id, name) VALUES ('${brand_id}', '${brand}')
            INTO brandmanage (brand_id, admin_id) VALUES ('${brand_id}', '${id}')
            INTO brandaddition (brand_id, admin_id, date_added) VALUES ('${brand_id}', '${id}', SYSDATE)`}
        INTO produces (product_id, brand_id) VALUES ('${product_id}', '${brand_id}')
      SELECT 1 FROM DUAL`)
        .then((result) => {
            if (result.rowsAffected > 0) {
                req.db.commit();
                res.status(200).send('Product added successfully');
            } else {
                res.status(500).send('Error adding product');
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).send('Error adding product');
        });
});

export default router;