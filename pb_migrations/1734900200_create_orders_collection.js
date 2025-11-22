// PocketBase Migration: Create Orders Collection for YooKassa Integration
// This migration creates the orders collection to track payment status

migrate((app) => {
  // Get users and products collections
  const usersCollection = app.findCollectionByNameOrId("users");
  const productsCollection = app.findCollectionByNameOrId("products");

  // Create orders collection (base)
  let ordersCollection;
  try {
    ordersCollection = app.findCollectionByNameOrId("orders");
  } catch (e) {
    ordersCollection = new Collection({
      type: "base",
      name: "orders",
      listRule: "user = @request.auth.id || owner = @request.auth.id",
      viewRule: "user = @request.auth.id || owner = @request.auth.id",
      createRule: "@request.auth.id != ''", // Authenticated users can create orders
      updateRule: "", // Only via webhook/admin
      deleteRule: "", // Admin only
      fields: [
        {
          type: "relation",
          name: "user",
          required: false, // Can be null for guest purchases
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          type: "relation",
          name: "product",
          required: true,
          collectionId: productsCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          type: "relation",
          name: "owner",
          required: true,
          collectionId: usersCollection.id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          type: "email",
          name: "customerEmail",
          required: true,
        },
        {
          type: "number",
          name: "amount",
          required: true,
          min: 0,
        },
        {
          type: "select",
          name: "status",
          required: true,
          values: ["pending", "paid", "canceled", "failed"],
          defaultValue: "pending",
        },
        {
          type: "text",
          name: "yookassa_payment_id",
          required: false,
          unique: true,
        },
        {
          type: "date",
          name: "paid_at",
          required: false,
        },
        {
          type: "json",
          name: "metadata",
          required: false,
        },
      ],
      indexes: [
        "CREATE INDEX idx_orders_user ON orders (user)",
        "CREATE INDEX idx_orders_owner ON orders (owner)",
        "CREATE INDEX idx_orders_product ON orders (product)",
        "CREATE INDEX idx_orders_status ON orders (status)",
        "CREATE INDEX idx_orders_yookassa_payment_id ON orders (yookassa_payment_id)",
      ],
    });
    app.save(ordersCollection);
  }
}, (app) => {
  // Rollback: delete orders collection
  try {
    const ordersCollection = app.findCollectionByNameOrId("orders");
    app.delete(ordersCollection);
  } catch (e) {
    // Collection might not exist, ignore
  }
});

