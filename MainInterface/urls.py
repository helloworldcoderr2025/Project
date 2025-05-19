from django.urls import path
from .views import home_page_view,upload_page_view,edit_page_view,get_all_tables_view
from .views import view_selected_table_view,get_columns_view,get_distinct_column_values_view,submit_query_view
from .views import table_operations_view,get_table_columns_view,get_row_ids_view,get_row_data_view

urlpatterns = [
    path('',home_page_view,name="home_page"),
    path('upload/',upload_page_view,name="upload_page"),
    path('edit/',edit_page_view,name="edit_page"),
    path('edit/view_selected_table/',view_selected_table_view,name="view_selected_table"),
    path('get_columns/',get_columns_view,name="get_columns"),
    path('table-operations/',table_operations_view, name='table_operations'),
    path('get-table-columns/',get_table_columns_view, name='get_table_columns'),
    path('get-row-ids/',get_row_ids_view, name='get_row_ids'),
    path('get-row-data/',get_row_data_view, name='get_row_data'),
    path('get_columns/',get_columns_view,name="get_columns"),
    path('get_distinct_column_values/',get_distinct_column_values_view,name="get_distinct_column_values"),
    path('get_all_tables', get_all_tables_view, name='get_all_tables'),
    path('submit_query',submit_query_view,name="submit_query")
]

