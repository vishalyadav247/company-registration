import axios from "axios";
import { Product } from "../mongodb/model.js";

const syncProducts = async (_req, res) => {
  let cursor = null;
  const shop = res.locals.shopify.session.shop; // Store domain
  const accessToken = res.locals.shopify.session.accessToken; // Auth token

  try {
    const shopifyApiUrl = `https://${shop}/admin/api/unstable/graphql.json`;

    const query = `
      query getProducts($cursor: String) {
        products(first: 250, after: $cursor) {
          edges {
            node {
              id
              title
              variants(first: 10) {
                nodes {
                  id
                  displayName
                  inventoryQuantity
                  inventoryPolicy
                  price
                  sku
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let hasNextPage = true;

    while (hasNextPage) {
      const response = await axios.post(
        shopifyApiUrl,
        { query, variables: { cursor } },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );

      const productsData = response.data.data.products;

      if (productsData.edges.length > 0) {
        for (const edge of productsData.edges) {
          const productNode = edge.node;

          await Product.updateOne(
            { shop, shopifyId: productNode.id }, // match the fields present in product collection
            {
              $set: {
                title: productNode.title,
              },
              $setOnInsert: { shop, shopifyId: productNode.id },
            },
            { upsert: true }
          );
        }
      }

      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor; // Update cursor for next page
    }

    res.status(200).send({ message: "All Products Successfully Sync." });
  } catch (error) {
    console.error("Error fetching and storing products:", error);
    res.status(500).send("Error fetching products");
  }
};

const productCount = async(req,res)=>{
  const shop = req.body.shop;
  try{
    const response = await Product.countDocuments({shop:shop})
    res.status(200).send({productCount:response})
  }catch(error){
    console.log(error)
  }
}

export { syncProducts,productCount };
