// PocketBase Migration: Create download_tokens collection
// This collection stores temporary tokens for file downloads after purchase

migrate((app) => {
  let downloadTokensCollection;
  try {
    downloadTokensCollection = app.findCollectionByNameOrId("download_tokens");
  } catch (e) {
    const ordersCollection = app.findCollectionByNameOrId("orders");
    const productsCollection = app.findCollectionByNameOrId("products");
    
    downloadTokensCollection = new Collection({
      type: "base",
      name: "download_tokens",
      listRule: "", // Only accessible via API with token
      viewRule: "", // Only accessible via API with token
      createRule: "", // Public for API route (admin only)
      updateRule: "", // Admin only
      deleteRule: "", // Admin only
      fields: [
        {
          type: "text",
          name: "token",
          required: true,
          unique: true,
        },
        {
          type: "relation",
          name: "order",
          required: true,
          collectionId: ordersCollection.id,
          cascadeDelete: true,
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
          type: "email",
          name: "customerEmail",
          required: true,
        },
        {
          type: "date",
          name: "expiresAt",
          required: true,
        },
        {
          type: "bool",
          name: "used",
          required: false,
          defaultValue: false,
        },
        {
          type: "number",
          name: "downloadCount",
          required: false,
          defaultValue: 0,
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_download_tokens_token ON download_tokens (token)",
        "CREATE INDEX idx_download_tokens_order ON download_tokens (order)",
        "CREATE INDEX idx_download_tokens_expires_at ON download_tokens (expiresAt)",
      ],
    });
    app.save(downloadTokensCollection);
  }
}, (app) => {
  // Rollback: delete collection
  try {
    const collection = app.findCollectionByNameOrId("download_tokens");
    app.delete(collection);
  } catch (e) {
    // Collection doesn't exist, nothing to rollback
  }
});

