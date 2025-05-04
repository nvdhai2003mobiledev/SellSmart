/**
 * Common pagination functionality for SellSmart application
 */

function initializePagination(options) {
    // Default options
    const config = {
        itemSelector: 'tbody tr',             // Selector for the items to paginate
        itemsPerPageSelector: '#itemsPerPage', // Selector for items per page dropdown
        currentPageSelector: '#currentPage',   // Selector for current page display
        prevPageSelector: '#prevPage',         // Selector for previous page button
        nextPageSelector: '#nextPage',         // Selector for next page button
        totalItemsSelector: '#totalItems',     // Selector for total items counter
        itemNameSingular: 'item',              // Item name in singular form
        itemNamePlural: 'items',               // Item name in plural form
        onPageChange: null,                    // Callback function when page changes
        initialPage: 1,                        // Initial page to display
        ...options                             // Override defaults with provided options
    };

    // Pagination state
    let state = {
        currentPageIndex: config.initialPage,
        itemsPerPage: parseInt($(config.itemsPerPageSelector).val()) || 10,
        filteredItems: [],
        allItems: []
    };

    // Initialize items array
    function initItems() {
        const items = $(config.itemSelector);
        state.allItems = items.toArray();
        state.filteredItems = [...state.allItems];
        
        // Update total items count
        $(config.totalItemsSelector).text(state.filteredItems.length);
    }
    
    // Update display based on pagination
    function updateItemDisplay() {
        // Hide all items initially
        $(config.itemSelector).hide();
        
        // Calculate total pages
        const totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
        
        // Show only items for current page
        const start = (state.currentPageIndex - 1) * state.itemsPerPage;
        const end = Math.min(start + state.itemsPerPage, state.filteredItems.length);
        
        for (let i = start; i < end; i++) {
            $(state.filteredItems[i]).show();
        }
        
        // Update pagination buttons state
        $(config.prevPageSelector).toggleClass('disabled', state.currentPageIndex === 1);
        $(config.nextPageSelector).toggleClass('disabled', state.currentPageIndex === totalPages || totalPages === 0);
        $(config.currentPageSelector).text(state.currentPageIndex);
        
        // Call the onPageChange callback if provided
        if (typeof config.onPageChange === 'function') {
            config.onPageChange(state);
        }
    }
    
    // Handle items per page change
    $(config.itemsPerPageSelector).on('change', function() {
        state.itemsPerPage = parseInt($(this).val());
        state.currentPageIndex = 1;
        updateItemDisplay();
    });
    
    // Handle previous page click
    $(config.prevPageSelector).on('click', function(e) {
        e.preventDefault();
        if (state.currentPageIndex > 1) {
            state.currentPageIndex--;
            updateItemDisplay();
        }
    });
    
    // Handle next page click
    $(config.nextPageSelector).on('click', function(e) {
        e.preventDefault();
        const totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
        if (state.currentPageIndex < totalPages) {
            state.currentPageIndex++;
            updateItemDisplay();
        }
    });
    
    // Filter items based on criteria
    function filterItems(filterFn) {
        if (typeof filterFn !== 'function') {
            state.filteredItems = [...state.allItems];
        } else {
            state.filteredItems = state.allItems.filter(filterFn);
        }
        
        // Reset to page 1 after filtering
        state.currentPageIndex = 1;
        
        // Update total count
        $(config.totalItemsSelector).text(state.filteredItems.length);
        
        updateItemDisplay();
    }
    
    // Initialize pagination
    initItems();
    updateItemDisplay();
    
    // Return public methods
    return {
        updateDisplay: updateItemDisplay,
        filterItems: filterItems,
        getState: () => ({ ...state }),
        resetFilters: () => {
            state.filteredItems = [...state.allItems];
            state.currentPageIndex = 1;
            $(config.totalItemsSelector).text(state.filteredItems.length);
            updateItemDisplay();
        }
    };
}
