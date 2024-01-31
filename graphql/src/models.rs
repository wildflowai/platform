use async_graphql::SimpleObject;

/// Represents a single column within a database table.
#[derive(SimpleObject)]
pub struct TableColumn {
    /// The name of the column.
    pub name: String,
}
