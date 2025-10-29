// Supabase configuration
const SUPABASE_URL = 'https://oznuzgelchqutoipmspv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bnV6Z2VsY2hxdXRvaXBtc3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMjE4NTAsImV4cCI6MjA3Njg5Nzg1MH0.83ZBg1MZyaiD2VQWoyeGHJ1lT-wSMMxvA_Ir1nQAo2U';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Pagination state
let currentPage = 1;
const PAGE_SIZE = 15;

// Fetch browsing logs from Supabase
async function fetchBrowsingLogs() {
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return { logs: [], totalCount: 0 };
    }
    const filterStatus = document.getElementById('filter-status').value;
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const dateFilter = document.getElementById('date-filter').value;

    try {
        let query = supabaseClient
            .from('browsing_logs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (filterStatus === 'suspicious') {
            query = query.eq('flagged_as_suspicious', true);
        } else if (filterStatus === 'safe') {
            query = query.eq('flagged_as_suspicious', false);
        }

        // Search on student_name or url
        if (searchQuery) {
            // use ILIKE for case-insensitive matching
            query = query.or(`student_name.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`);
        }

        // Date filter (visited_at)
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setDate(endDate.getDate() + 1);
            query = query.gte('visited_at', startDate.toISOString()).lt('visited_at', endDate.toISOString());
        }

        // Pagination
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to).order('visited_at', { ascending: false });

        const { data, count, error } = await query;
        if (error) throw error;

        const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
        const pageInfoEl = document.getElementById('page-info');
        if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;

        return { logs: data || [], totalCount: count || 0 };
    } catch (err) {
        console.error('Error fetching browsing logs:', err);
        return { logs: [], totalCount: 0 };
    }
}

// URL filtering + Supabase integration for HatchOS admin
// Edit SUPABASE_URL and SUPABASE_KEY with your project's values
const SUPABASE_URL = 'https://oznuzgelchqutoipmspv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bnV6Z2VsY2Vsc2NocXV0b2lwbXNwdiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzYxMzIxODUwLCJleHAiOjIwNzY4OTc4NTB9.83ZBg1MZyaiD2VQWoyeGHJ1lT-wSMMxvA_Ir1nQAo2U';

let supabaseClient = null;

function initializeSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase library not loaded. Make sure the CDN script is included before this file.');
        return;
    }

    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
    } catch (err) {
        console.error('Failed to initialize Supabase client', err);
    }
}

// Pagination state
let currentPage = 1;
const PAGE_SIZE = 15;

// Fetch browsing logs from Supabase
async function fetchBrowsingLogs() {
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return { logs: [], totalCount: 0 };
    }

    const filterStatusEl = document.getElementById('filter-status');
    const searchEl = document.getElementById('search-input');
    const dateEl = document.getElementById('date-filter');

    const filterStatus = filterStatusEl ? filterStatusEl.value : 'all';
    const searchQuery = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const dateFilter = dateEl ? dateEl.value : '';

    try {
        let query = supabaseClient
            .from('browsing_logs')
            .select('*', { count: 'exact' });

        // Status filter
        if (filterStatus === 'suspicious') {
            query = query.eq('flagged_as_suspicious', true);
        } else if (filterStatus === 'safe') {
            query = query.eq('flagged_as_suspicious', false);
        }

        // Search on student_name or url
        if (searchQuery) {
            // use ILIKE for case-insensitive matching
            query = query.or(`student_name.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`);
        }

        // Date filter (visited_at)
        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setDate(endDate.getDate() + 1);
            query = query.gte('visited_at', startDate.toISOString()).lt('visited_at', endDate.toISOString());
        }

        // Pagination
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to).order('visited_at', { ascending: false });

        const { data, count, error } = await query;
        if (error) throw error;

        const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
        const pageInfoEl = document.getElementById('page-info');
        if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;

        return { logs: data || [], totalCount: count || 0 };
    } catch (err) {
        console.error('Error fetching browsing logs:', err);
        return { logs: [], totalCount: 0 };
    }
}

// Update the browsing logs table
async function updateBrowsingLogs() {
    const tbody = document.querySelector('#browsing-logs-table tbody');
    if (!tbody) return; // page not loaded or removed

    const { logs, totalCount } = await fetchBrowsingLogs();

    tbody.innerHTML = (logs || []).map(log => `
        <tr>
            <td>${log.visited_at ? new Date(log.visited_at).toLocaleString() : '-'}</td>
            <td>${log.student_name || log.student_id || '-'}</td>
            <td class="url-cell"><a href="${escapeHtml(log.url || '')}" target="_blank" rel="noopener noreferrer">${escapeHtml(log.url || '')}</a></td>
            <td>${escapeHtml(log.site_title || '')}</td>
            <td><span class="status-badge ${log.flagged_as_suspicious ? 'suspicious' : 'safe'}">${log.flagged_as_suspicious ? 'Suspicious' : 'Safe'}</span></td>
            <td class="reason-cell">${escapeHtml(log.reason || '-')}</td>
        </tr>
    `).join('');

    // Update stats
    const totalEl = document.querySelector('#total-urls .value');
    const suspiciousEl = document.querySelector('#suspicious-urls .value');
    if (totalEl) totalEl.textContent = totalCount;
    if (suspiciousEl) suspiciousEl.textContent = (logs || []).filter(l => l.flagged_as_suspicious).length;
}

function changePage(delta) {
    currentPage = Math.max(1, currentPage + delta);
    updateBrowsingLogs();
}

function filterBrowsingLogs() {
    currentPage = 1;
    updateBrowsingLogs();
}

// Small utility to escape HTML in strings inserted into DOM
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Export for dashboard integration
window.updateBrowsingLogs = updateBrowsingLogs;
window.changePage = changePage;
window.filterBrowsingLogs = filterBrowsingLogs;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeSupabase();
    // initial load
    setTimeout(updateBrowsingLogs, 300); // small delay to ensure DOM ready
    // auto refresh every 30s
    setInterval(updateBrowsingLogs, 30000);
});