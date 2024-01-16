use async_graphql::{Context, EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};

/// A single column within a database table.
#[derive(SimpleObject)]
struct TableColumn {
    /// The name of the column.
    name: String,
}

/// Represents a database table with multiple columns.
#[derive(SimpleObject)]
struct Table {
    /// The name of the table.
    name: String,
    /// A list of columns in the table.
    columns: Vec<TableColumn>,
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Fetches a list of tables available in the database.
    ///
    /// This query will return all tables along with their columns.
    async fn tables(&self, _ctx: &Context<'_>) -> Vec<Table> {
        vec![
            Table {
                name: "Table1".to_string(),
                columns: vec![
                    TableColumn {
                        name: "Column1".to_string(),
                    },
                    TableColumn {
                        name: "Column2".to_string(),
                    },
                ],
            },
            // Add more tables as needed
        ]
    }
}

pub type MySchema = Schema<QueryRoot, EmptyMutation, EmptySubscription>;

/// Creates and returns a new GraphQL schema.
pub fn create_schema() -> MySchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
