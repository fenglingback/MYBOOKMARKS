import requests
from jinja2 import Environment, FileSystemLoader
import os

username = os.environ.get('USERNAME')
reponame = os.environ.get('REPO_NAME')

# username = 'fenglingback'
# reponame = 'TDC'



def get_data():
    # 替换为你的 GitHub 访问令牌，可以解除请求限制
    # access_token = 'your_access_token'

    # headers = {'Authorization': f'token {access_token}'}

    bm_url = f'https://api.github.com/repos/{username}/{reponame}/issues'
    bm_params = {'state': 'open'}
    bm_resp = requests.get(bm_url, params=bm_params)
    issues = bm_resp.json()
    bookmarks = []
    for issue in issues:
        # 过滤非自己的 issue
        if issue['user']['login'] != username:
            continue

        # 获取书签名
        bookmark_title = issue['title']
        # print(f"bookmark_title: {bookmark_title}")

        body = issue['body']

        if '\n\n' in body:
            bookmark_url, bookmark_desc = tuple(body.split('\n\n', 1))
        elif '\r\n\r\n' in body:
            bookmark_url, bookmark_desc = tuple(body.split('\r\n\r\n', 1))
        else:
            bookmark_url, bookmark_desc = (body, '')

        # print(f"bookmark_url: {bookmark_url}")
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
    all_tags_url = f'https://api.github.com/repos/{username}/{reponame}/labels'
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
        result = template.render(all_tags=all_tags, bookmarks=bookmarks, username=username, reponame=reponame)
        f.write(result)


if __name__ == '__main__':

    render(*get_data())
    # get_data()



