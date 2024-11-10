import json
import requests
from jinja2 import Environment, FileSystemLoader


def get_data_by_json():
    with open('configs.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 获取书签数据
    bookmarks = data['Bookmarks']
    # print(bookmarks)

    # 获取所有标签
    all_tags = sorted({tag for bookmark in bookmarks for tag in bookmark['tags']})
    # print(all_tags)

    return all_tags, bookmarks


def get_data_by_issues():
    # 替换为你的 GitHub 用户名和仓库名
    # username = 'your_username'
    # repo_name = 'your_repo_name'

    username = 'fenglingback'
    repo_name = 'TDC'

    # 替换为你的 GitHub 访问令牌，可以解除请求限制
    # access_token = 'your_access_token'

    # headers = {'Authorization': f'token {access_token}'}

    bm_url = f'https://api.github.com/repos/{username}/{repo_name}/issues'
    bm_params = {'state': 'open'}
    bm_resp = requests.get(bm_url, params=bm_params)
    issues = bm_resp.json()
    bookmarks = []
    for issue in issues:
        # 获取标题，格式为：书签名 书签链接
        # 书签名和书签链接之间用空格隔开
        title = issue['title']
        # print(f"title: {issue['title']}")

        # 获取书签名
        bookmark_title = title.split(' ')[0]
        # print(f"bookmark_name: {bookmark_title}")

        # 获取书签链接
        bookmark_url = title.split(' ')[1]
        # print(f"bookmark_url: {bookmark_url}")

        # 获取描述
        bookmark_desc = issue['body']
        # print(f"bookmark_desc: {bookmark_desc}")

        # 获取标签
        tags = [label['name'] for label in issue.get('labels', [])]
        # print(f"tags: {tags}")

        # 构建书签对象
        bm = {'title': bookmark_title, 'url': bookmark_url, 'desc': bookmark_desc, 'tags': tags}
        # print(bm)

        # 生成书签数据
        bookmarks.append(bm)
        # print(bookmarks)


    # 获取所有标签
    all_tags_url = f'https://api.github.com/repos/{username}/{repo_name}/labels'
    all_tags_resp = requests.get(all_tags_url)
    all_tags = [tag['name'] for tag in all_tags_resp.json()]
    # print(all_tags)

    return all_tags, bookmarks




def render(all_tags, bookmarks):
    # 创建模板加载器
    templateLoader = FileSystemLoader(searchpath="./")

    # 创建模板环境
    templateEnv = Environment(loader=templateLoader)

    # 加载模板文件
    template = templateEnv.get_template("index_template.html")

    # 将数据渲染到模板中，并将结果写入目标文件
    with open('index.html', 'w', encoding='utf-8') as f:
        result = template.render(all_tags=all_tags, bookmarks=bookmarks)
        f.write(result)


if __name__ == '__main__':
    
    # render(*get_data_by_json())

    render(*get_data_by_issues())

