document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const tagButtons = document.querySelectorAll('.tag-btn');
    const bookmarks = document.querySelectorAll('.bookmark');
    const bm_repo = document.body.dataset.reponame;
    const bm_user = document.body.dataset.username;
    const starButton = document.getElementById('star-button');
    const starIcon = starButton.querySelector('.star-icon');
    localStorage.setItem('bm_repo', bm_repo);
    localStorage.setItem('bm_user', bm_user);

    let selectedTags = new Set();
    let debounceTimer;

    // 存储初始的本地存储状态
    const initialStorageState = JSON.stringify(localStorage);

    // 监控本地存储变化并刷新页面
    function checkStorageAndReload() {
        const currentStorageState = JSON.stringify(localStorage);
        if (currentStorageState !== initialStorageState) {
            window.location.reload();
        }
    }

    // 每秒检查一次本地存储的变化
    setInterval(checkStorageAndReload, 1000);

    function debounce(func, delay) {
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function filterBookmarks() {
        const searchTerm = searchInput.value.toLowerCase();

        bookmarks.forEach(bookmark => {
            const title = bookmark.querySelector('.bookmark-title').textContent.toLowerCase();
            const desc = bookmark.querySelector('.bookmark-desc')?.textContent.toLowerCase() || '';
            const tags = new Set(bookmark.dataset.tags.split(','));

            const matchesTags = selectedTags.size === 0 ||
                [...selectedTags].every(tag => tags.has(tag));
            const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);

            bookmark.style.display = (matchesTags && matchesSearch) ? '' : 'none';
        });
    }

    const debouncedFilterBookmarks = debounce(filterBookmarks, 500);

    searchInput.addEventListener('input', debouncedFilterBookmarks);

    function toggleTag(button) {
        const tag = button.dataset.tag;
        if (selectedTags.has(tag)) {
            selectedTags.delete(tag);
            button.classList.remove('active');
        } else {
            selectedTags.add(tag);
            button.classList.add('active');
        }
        filterBookmarks();
    }

    tagButtons.forEach(button => {
        let touchStartTime;
        let isTouchMove = false;

        button.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            isTouchMove = false;
        });

        button.addEventListener('touchmove', () => {
            isTouchMove = true;
        });

        button.addEventListener('touchend', (e) => {
            if (!isTouchMove && (Date.now() - touchStartTime) < 200) {
                e.preventDefault();
                toggleTag(button);
            }
        });

        // 保留点击事件，用于桌面端
        button.addEventListener('click', (e) => {
            if (!('ontouchstart' in window)) {
                toggleTag(button);
            }
        });
    });

    filterBookmarks();

    // 显示令牌输入对话框
    function showTokenDialog() {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h2>设置 GitHub 个人访问令牌</h2>
                <p>请输入您的 GitHub 个人访问令牌。这将用于访问 GitHub API。</p>
                <input type="password" id="github-token-input" placeholder="输入您的 GitHub 令牌">
                <button id="save-token-btn">保存</button>
                <button id="cancel-btn">&times;</button>
            </div>
        `;
        document.body.appendChild(dialog);

        // 禁止页面滚动
        document.body.style.overflow = 'hidden';

        const saveButton = document.getElementById('save-token-btn');
        const cancelButton = document.getElementById('cancel-btn');
        saveButton.addEventListener('click', checkAndSaveGitHubToken);
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
            // 恢复页面滚动
            document.body.style.overflow = '';
        });
    }

    // 检查并保存GitHub令牌到本地存储
    async function checkAndSaveGitHubToken() {
        const tokenInput = document.getElementById('github-token-input');
        const temp_token = tokenInput.value.trim();

        const url = `https://api.github.com/user`
        const headers = {
            'Authorization': `token ${temp_token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 200) {
                const data = await response.json();
                const username = data.login;
                if (username === bm_user) {
                    localStorage.setItem('githubToken', temp_token);
                    document.body.removeChild(document.querySelector('.dialog-overlay').parentNode);
                    // 恢复页面滚动
                    document.body.style.overflow = '';
                } else {
                    alert('令牌有效，但不属于该用户！');
                    tokenInput.value = '';
                }
            } else {
                alert('令牌无效，请检查令牌是否正确');
                tokenInput.value = '';
            }
        } catch (error) {
            alert('检查网络连接！');
            console.error('Error:', error);
        }
    }

    async function toggleStar() {
        const token = localStorage.getItem('githubToken');
        if (!token) {
            showTokenDialog();
            return;
        }

        const url = `https://api.github.com/user/starred/${bm_user}/${bm_repo}`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers
            });

            if (response.status === 204) {
                starButton.classList.add('starred');
                starIcon.setAttribute('fill', 'currentColor');
                console.log('Successfully starred the repository');

                // Wait for 1 second and then unstar
                setTimeout(async () => {
                    const unstarResponse = await fetch(url, {
                        method: 'DELETE',
                        headers: headers
                    });

                    if (unstarResponse.status === 204) {
                        starButton.classList.remove('starred');
                        starIcon.setAttribute('fill', 'none');
                        console.log('Successfully unstarred the repository');
                        alert('正在启动部署，部署时间平均30s，部署完成后刷新页面即可');
                    } else {
                        console.error('Failed to unstar the repository');
                    }
                }, 1000);
            } else {
                console.error('Failed to star the repository');
            }
        } catch (error) {
            alert('部署失败，打开控制台查看报错，检查你的token和网络连接，如果仍然无法解决，请联系网站管理员');
            console.error('Error:', error);
        }
    }

    starButton.addEventListener('click', toggleStar);

    console.log("\n %c TDC %c https://github.com/fenglingback/TDC \n", "color: #0ca7a4; background-image: linear-gradient(90deg, #555555 0%, #555555 100%); padding:5px 1px;", "color: #a277ff; background-image: linear-gradient(90deg, #555555 0%, #1d294d 100%); padding:5px 0;");
});