/**
 * Student Feedback Portal & Admin Dashboard - Interactive Script
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. LIGHT / DARK THEME MANAGER ---
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    const bodyEl = document.body;

    // Load saved preference from localStorage
    const savedTheme = localStorage.getItem("hub-theme") || "light";
    if (savedTheme === "dark") {
        bodyEl.classList.remove("light-mode");
        bodyEl.classList.add("dark-mode");
    } else {
        bodyEl.classList.remove("dark-mode");
        bodyEl.classList.add("light-mode");
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            if (bodyEl.classList.contains("light-mode")) {
                bodyEl.classList.replace("light-mode", "dark-mode");
                localStorage.setItem("hub-theme", "dark");
            } else {
                bodyEl.classList.replace("dark-mode", "light-mode");
                localStorage.setItem("hub-theme", "light");
            }
        });
    }

    // --- 2. STUDENT PORTAL: RATING STAR INTERACTION ---
    const ratingContainer = document.getElementById("ratingContainer");
    const ratingInput = document.getElementById("ratingInput");
    
    if (ratingContainer && ratingInput) {
        const stars = ratingContainer.querySelectorAll(".star");

        // Hover Effect
        stars.forEach(star => {
            star.addEventListener("mouseenter", () => {
                const hoverValue = parseInt(star.getAttribute("data-value"));
                stars.forEach(s => {
                    const sValue = parseInt(s.getAttribute("data-value"));
                    if (sValue <= hoverValue) {
                        s.classList.add("hovered");
                    } else {
                        s.classList.remove("hovered");
                    }
                });
            });

            star.addEventListener("mouseleave", () => {
                stars.forEach(s => s.classList.remove("hovered"));
            });

            // Selection click
            star.addEventListener("click", () => {
                const selectValue = star.getAttribute("data-value");
                ratingInput.value = selectValue;
                
                // Trigger form-group validation refresh
                document.getElementById("ratingError").style.display = "none";
                document.getElementById("ratingError").parentElement.classList.remove("has-error");

                updateStarsUI(selectValue);
            });
        });

        function updateStarsUI(val) {
            stars.forEach(s => {
                const sValue = parseInt(s.getAttribute("data-value"));
                if (sValue <= parseInt(val)) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
                }
            });
        }
    }

    // --- 3. STUDENT PORTAL: FORM VALIDATION & AJAX SUBMIT ---
    const feedbackForm = document.getElementById("studentFeedbackForm");
    const submitBtn = document.getElementById("submitBtn");
    const successModal = document.getElementById("successModal");
    const closeModalBtn = document.getElementById("closeModalBtn");

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Perform full validation
            const isValid = validateFeedbackForm();
            if (!isValid) return;

            // Form data extraction
            const formData = {
                name: document.getElementById("name").value.trim(),
                email: document.getElementById("email").value.trim(),
                rating: ratingInput.value,
                experience: document.getElementById("experience").value.trim()
            };

            // Toggle Loading State
            setLoadingState(true);

            try {
                const response = await fetch("/submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.status === "success") {
                    // Show success modal
                    successModal.classList.remove("hidden");
                    
                    // Reset form fields
                    feedbackForm.reset();
                    ratingInput.value = "";
                    if (stars = ratingContainer?.querySelectorAll(".star")) {
                        stars.forEach(s => s.classList.remove("active"));
                    }
                } else {
                    alert(result.message || "An error occurred while submitting feedback.");
                }
            } catch (error) {
                console.error("Submission failed:", error);
                alert("Failed to connect to the server. Please check your connection.");
            } finally {
                setLoadingState(false);
            }
        });

        // Close modal event
        if (closeModalBtn && successModal) {
            closeModalBtn.addEventListener("click", () => {
                successModal.classList.add("hidden");
            });
        }

        // Setup real-time input error dismissal
        const textInputs = ["name", "email", "experience"];
        textInputs.forEach(id => {
            const inputEl = document.getElementById(id);
            if (inputEl) {
                inputEl.addEventListener("input", () => {
                    const group = inputEl.closest(".form-group");
                    if (group.classList.contains("has-error")) {
                        group.classList.remove("has-error");
                    }
                });
            }
        });
    }

    function validateFeedbackForm() {
        let isValid = true;

        // Name verification
        const nameEl = document.getElementById("name");
        const nameVal = nameEl.value.trim();
        if (!nameVal) {
            setErrorState("name", true);
            isValid = false;
        } else {
            setErrorState("name", false);
        }

        // Email verification
        const emailEl = document.getElementById("email");
        const emailVal = emailEl.value.trim();
        const emailRegex = /^[\w\.-]+@[\w\.-]+\.\w+$/;
        if (!emailVal || !emailRegex.test(emailVal)) {
            setErrorState("email", true);
            isValid = false;
        } else {
            setErrorState("email", false);
        }

        // Rating verification
        if (!ratingInput.value) {
            const ratingGroup = ratingInput.closest(".form-group");
            ratingGroup.classList.add("has-error");
            isValid = false;
        } else {
            const ratingGroup = ratingInput.closest(".form-group");
            ratingGroup.classList.remove("has-error");
        }

        // Experience verification
        const experienceEl = document.getElementById("experience");
        const experienceVal = experienceEl.value.trim();
        if (!experienceVal) {
            setErrorState("experience", true);
            isValid = false;
        } else {
            setErrorState("experience", false);
        }

        return isValid;
    }

    function setErrorState(fieldId, hasError) {
        const inputEl = document.getElementById(fieldId);
        if (!inputEl) return;
        
        const group = inputEl.closest(".form-group");
        if (hasError) {
            group.classList.add("has-error");
        } else {
            group.classList.remove("has-error");
        }
    }

    function setLoadingState(isLoading) {
        if (!submitBtn) return;
        const btnText = submitBtn.querySelector(".btn-text");
        const spinner = submitBtn.querySelector(".spinner");

        if (isLoading) {
            submitBtn.disabled = true;
            if (btnText) btnText.textContent = "Submitting...";
            if (spinner) spinner.classList.remove("hidden");
        } else {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = "Submit Feedback";
            if (spinner) spinner.classList.add("hidden");
        }
    }


    // --- 4. ADMIN PORTAL: REAL-TIME DATA QUERY & ANALYTICS ---
    const feedbackTable = document.getElementById("feedbackTable");
    const feedbackTableBody = document.getElementById("feedbackTableBody");
    const adminSearchInput = document.getElementById("adminSearchInput");
    const adminSearchBtn = document.getElementById("adminSearchBtn");
    const adminRatingFilter = document.getElementById("adminRatingFilter");

    // Only execute dashboard fetch if we are actually on the admin table view
    if (feedbackTable && feedbackTableBody) {
        
        // Initial dashboard query
        fetchAdminDashboardData();

        // Listeners for live filtering with a simple debounce wrapper
        let filterTimeout;
        const triggerFilter = () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => {
                const searchVal = adminSearchInput.value.trim();
                const ratingVal = adminRatingFilter.value;
                fetchAdminDashboardData(searchVal, ratingVal);
            }, 300); // 300ms debounce
        };

        if (adminSearchInput) adminSearchInput.addEventListener("input", triggerFilter);
        if (adminRatingFilter) adminRatingFilter.addEventListener("change", triggerFilter);

        // Instantly search on button click
        if (adminSearchBtn) {
            adminSearchBtn.addEventListener("click", () => {
                const searchVal = adminSearchInput.value.trim();
                const ratingVal = adminRatingFilter.value;
                fetchAdminDashboardData(searchVal, ratingVal);
            });
        }
    }

    async function fetchAdminDashboardData(search = "", rating = "") {
        try {
            // Build API URL query string
            let url = "/api/feedback";
            const params = [];
            if (search) params.push(`search=${encodeURIComponent(search)}`);
            if (rating) params.push(`rating=${encodeURIComponent(rating)}`);
            if (params.length > 0) url += `?${params.join("&")}`;

            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.reload(); // Refresh to trigger login view
                    return;
                }
                throw new Error("Failed to load feedback");
            }

            const data = await response.json();
            if (data.status === "success") {
                renderTable(data.feedbacks);
                renderAnalytics(data.analytics);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
            feedbackTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 error-msg" style="display: table-cell;">
                        ⚠️ Failed to load database. Please try refreshing.
                    </td>
                </tr>
            `;
        }
    }

    function renderTable(feedbacks) {
        if (!feedbacks || feedbacks.length === 0) {
            feedbackTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        No feedback records found matching your filters.
                    </td>
                </tr>
            `;
            return;
        }

        let html = "";
        feedbacks.forEach(f => {
            const dateFormatted = formatDBDate(f.submitted_at);
            const stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
            
            html += `
                <tr class="fade-in">
                    <td>#${f.id}</td>
                    <td>
                        <div class="cell-student">
                            <span class="cell-name">${escapeHTML(f.name)}</span>
                            <span class="cell-email">${escapeHTML(f.email)}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="cell-stars" title="${f.rating}/5 stars">${stars}</span>
                    </td>
                    <td>
                        <div class="cell-experience">${escapeHTML(f.experience)}</div>
                    </td>
                    <td>
                        <span class="cell-date">${dateFormatted}</span>
                    </td>
                </tr>
            `;
        });
        feedbackTableBody.innerHTML = html;
    }

    function renderAnalytics(analytics) {
        if (!analytics) return;

        // 1. Update Core KPI cards
        const kpiTotal = document.getElementById("kpiTotal");
        const kpiAverage = document.getElementById("kpiAverage");
        const kpiAvgStars = document.getElementById("kpiAvgStars");

        if (kpiTotal) kpiTotal.textContent = analytics.total_count;
        if (kpiAverage) kpiAverage.textContent = analytics.average_rating.toFixed(1);
        
        if (kpiAvgStars) {
            const roundedRating = Math.round(analytics.average_rating);
            kpiAvgStars.textContent = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
            kpiAvgStars.title = `${analytics.average_rating}/5 average`;
        }

        // 2. Draw Rating CSS Bar chart
        const ratingDistributionContainer = document.getElementById("ratingDistributionContainer");
        if (ratingDistributionContainer) {
            const total = analytics.total_count || 1; // Avoid divide-by-zero
            let chartHtml = "";
            
            // Loop descending from 5 stars to 1 star
            for (let stars = 5; stars >= 1; stars--) {
                const count = analytics.distribution[stars] || 0;
                const percentage = Math.round((count / total) * 100);
                
                chartHtml += `
                    <div class="chart-row">
                        <span class="chart-label">${stars} ⭐</span>
                        <div class="chart-progress-bg">
                            <div class="chart-progress-fill" style="width: ${percentage}%;"></div>
                        </div>
                        <span class="chart-count" title="${percentage}% of total submissions">${count} (${percentage}%)</span>
                    </div>
                `;
            }
            ratingDistributionContainer.innerHTML = chartHtml;
        }
    }

    // --- Helper Utilities ---

    function formatDBDate(dateStr) {
        if (!dateStr) return "";
        try {
            // Adjust sqlite UTC timestamp and append 'Z' for UTC timezone parsing
            const t = dateStr.replace(" ", "T") + "Z";
            const d = new Date(t);
            if (isNaN(d.getTime())) {
                return dateStr;
            }
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
            }) + " " + d.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch (e) {
            return dateStr;
        }
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
