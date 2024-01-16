use async_graphql::SimpleObject;

/// Represents a single column within a database table.
#[derive(SimpleObject)]
pub struct TableColumn {
    /// The name of the column.
    pub name: String,
}

/// Represents a database table with multiple columns.
#[derive(SimpleObject)]
pub struct Table {
    /// The name of the table.
    pub name: String,
    /// A list of columns in the table.
    pub columns: Vec<TableColumn>,
}
