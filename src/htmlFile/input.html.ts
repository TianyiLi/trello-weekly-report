const style = /* css */`
html, body {
  margin: 0;
  padding: 0;
  width: 100vw;
  display: flex;
  justify-content: space-around;
}
.input, #render {
  width: 50%;
  margin-top: 20px;
}

#render {
  padding: 15px;
  box-sizing: border-box;
  border: solid 1px black;
}

#text-content {
  width: 100%;
  height: 40vh;
  margin-bottom: 15px;
}
`

export const appendingJS = (content: string) => /*html*/ `
<style>
${style}
</style>
<body>
<div class="input">
<textarea id="text-content"></textarea>
<button id="submit">submit</button>
</div>

<div id="render" contenteditable>${content}</div>

<script>
const content = document.getElementById('text-content');
const render$ = document.getElementById('render')
content.value = ${'`' + content + '`'};
document.getElementById('submit').addEventListener('click', e => {
  fetch('/api/update', {method: 'POST', body: JSON.stringify({content:content.value})})
    .then(res => alert('update success'))
    .catch(err => alert('update failed'))
})

render$.addEventListener('input', function () {
  content.value = this.innerHTML
})

content.addEventListener('input', e => {
  document.getElementById('render').innerHTML = content.value
})
</script>
</body>
`
