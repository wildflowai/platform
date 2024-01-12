use async_graphql::{Context, EmptyMutation, EmptySubscription, Object, Schema, SimpleObject};

#[derive(SimpleObject)]
struct TableColumn {
    name: String,
}

#[derive(SimpleObject)]
struct Table {
    name: String,
    columns: Vec<TableColumn>,
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
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

pub fn create_schema() -> MySchema {
    Schema::build(QueryRoot, EmptyMutation, EmptySubscription).finish()
}
