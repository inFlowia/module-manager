/* Функции, необходимые для работы Module Manager.
Не несут особой "художественной ценности", опубликованы только для обеспечения работы основного модуля
*/


/* подключает скрипт с заданным в аргументе путём и именем в виде /someCat/someScrpt.js из каталога скрипта
АРГУМЕНТЫ:
	path - путь к скрипту в виде /someCat/someScrpt.js
	is_async - не обязательный ВНИМАНИЕ! Не работает так как может ожидаться - то есть если в скрипте есть подлючение скрипта с is_async = false это не значит, что скрипт подождёт пока он подключится. нет, он сразу продолжит выполнение после подключения а подключенный скрипт подключится всё равно потом.
	to_head - добавлять ли скрипт в head (true - в head, false - в body) не обязательный
Если подкл. модуль используется в JS в основном документе то лучше не рисковать и использование выполнять с зажержкой после document ready:
$(document).ready(function(){setTimeout(showRndCh1, 4000);});
function showRndCh1(){
  то что надо делать
};
*/
function include_script(path, is_async = true, to_head = true){
    let script = document.createElement('script');
    script.src = path;
		script.async = is_async;
		if(to_head)
    	document.head.appendChild(script);
		else
			document.body.appendChild(script);
}


// переименование вывода в консоль
function c_log(msg){
	console.log(msg);}
