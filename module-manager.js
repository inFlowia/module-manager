/* Module Manager 0.1 - Динамически подключает модули по необходимости
	Необходимость подключения модуля определяется наличем на странице элемента, удовлетворяющего jQ-селектору.
	Попытка подключения происходит по событию doc ready а так же при каждом динамическом добавлении дочерних элементов к body после события doc ready

	ТРЕБУЕТ:
		jQuery (тестировалось на 3.3.1)
		функции от inFlowia Lab.:
			include_script()
			c_log() (только для отладки)
			
Данный скрипт разработан inFlowia Lab. Ссылки на оригинальный код и текст соглашения ищите на inflowia.ru.
*/
{ // обл. вид

	/* Массив модулей, которые должны быть подключены.
		sel - селектор, по наличию котороно на странице определяется, нужно ли подключать модуль
		src - путь к модулю от корня сайта
	 */
	let modules = [
		/*
		Пример наполнения этого массива:
		{	sel: '.sp, .sp-op, .sp-silent',
			src: '/lib/spoiler/sp.js'
		},
		{	sel: '.ancLink',
			src: '/lib/ancLink/al.js'
		},
		{	sel: '[data-d]',
			src: '/lib/hlFresh.js'
		},
		{	sel: '.dd',
			src: '/lib/dd/dd.js'
		},
		{	sel: '.dd_menu',
			src: '/lib/dd/dd-menu.js'
		},
		{	sel: 'table.hTips',
			src: '/lib/tableHTips.js'
		},
		{	sel: '[onclick *= copy_to_clipboard]',
			src: '/lib/spec.js'
		}*/
	];
	// Не пытайся подключить здесь rnd.js для rndCh - это событе для него слишком позднее.


	let	need_loaded_scripts_update = true; // поднимать флаг всякий раз, когда нужно обновить loaded_scripts
	let loaded_scripts; // список загруженных скриптов. Нужен чтобы не подключать скрипты повторно. Не должна быть внутри is_included иначе будет лишнее выполнение запроса (оптимизация); Обновлять только через функцию update_loaded_scripts

	/* актуализирует информацию о загруженных, страницей скриптах
	актуализирует, только если поднят флаг need_loaded_scripts_update
	после актуализации сбрасывает его
	*/
	function update_loaded_scripts(){
		if(need_loaded_scripts_update){
			loaded_scripts = document.getElementsByTagName('script');
			need_loaded_scripts_update = false;
			// console.log('был обновлён список подключенных скриптов');
		}
	}


	$(document).ready(function(){
		/* проверяет подключен ли уже скрипт
		 script_src - путь к скрипту строго от корня сайта то есть в виде /path/to/script.js
		*/
		function is_included(script_src){
			update_loaded_scripts();
			for(let i in loaded_scripts){
				if(loaded_scripts[i].src === window.location.origin + script_src){
				//	c_log(script_src+ ' уже был подключен');
					return true;
				}
			}
			// c_log(script_src+ ' ещё не подключен');
			return false;
		} // is_included

		need_loaded_scripts_update = true; // так как к моменту готовности документа могли добавить скрипт
		update_loaded_scripts();
		modules.forEach((m, i)=>{
			if($('body').find(m.sel + ':first').length){ // потенциальная причина потери производитетельности. Не уверен, что :first облегчает задачу.
				if(!is_included(m.src)){ // проверяется без обновления списка подключенного, так как он обновляется 1 раз перед этим циклом. Если в modules нет повторов то нет смысла обновлять на каждом шаге.
					include_script(m.src);
					// c_log(m.src + ' подключен при doc_ready');
					modules.splice(i, 1); // удаление добавленного модуля из массива претендентов на добавление. Позволяет уменьшить количество шагов в циклах при последующих проверках.
				}
			}
			// c_log('Проверка необходимости подключения модуля при doc ready');
		}); // modules.forEach
		need_loaded_scripts_update = true;


		// --- Повторная попытка подключения, если в body были добавлены новые элементы
		watch_always();
		function watch_always(){ // вынесено в функцию только для удобного отключения
			var target = document.body; // выбор элемента для отслеживания изменений DOM

			// за какими изменениями наблюдать
			const config = {
				childList: true, // добавление дочерних элементов
				subtree: true // и дочерних под-элементов
			};

			// Колбэк-функция при срабатывании мутации
			const callback = function(mutationsList, observer) {
				 // c_log('изменён dom');
				need_loaded_scripts_update = true; // нужно обновить, так как если изменялся DOM, значит возможно добавлялись скрипты прямо в тело. (Если скрипт добавлялся через include_script, то он добавляется в head а не в body и соответственно callback не случится, так как здесь отслеживается только body.)
				// не делаю здесь update_loaded_scripts() так как он делается в is_included
				let module_was_included = false; // нужна, чтобы можно было поднимать флаг need_loaded_scripts_update списка подключенного только в конце а не на каждом шаге. Если поднимать need_loaded_scripts_update на каждом шаге, то на каждом шаге будет обновление в is_included
				modules.forEach((m, i)=>{
					if($('body').find(m.sel + ':first').length){
						update_loaded_scripts();
						if(!is_included(m.src)){
							include_script(m.src);
							module_was_included = true;
							// c_log(m.src + ' подключен при изменении DOM');
							modules.splice(i, 1); // удаление добавленного модуля из массива претендентов на добавление. Позволяет уменьшить количество шагов в циклах при последующих проверках.
						}
					}
					// c_log('Проверка необходимости подключения модуля при добавлении элементов в body');
				}); // modules.forEach

				/*
				// я предположил, что эффективнее проверять только классы добавленного и его потомков но по факту это привело к сильному падению производительности
				mutationsList.forEach((mutationRecord)=>{
					mutationRecord.addedNodes.forEach((addedNode)=>{ // а вот тут большой вопрос - что лучше - один раз сделать запрос ко всей странице или сделать столько запросов, сколько добавленных узлов? Скорее всего это и есть причина
						modules.forEach((m)=>{
							if($(addedNode).find(m.sel + ':first').length){ // задачу.
								include_script(m.src);
							}
						}); // modules.forEach
					}); // addedNodes.forEach
				}); // mutationsList forEach
				*/
				if(module_was_included)
					need_loaded_scripts_update = true;
			}; // callback

			// Создаём экземпляр наблюдателя с указанной функцией колбэка
			const observer = new MutationObserver(callback);

			// Начинаем наблюдение за настроенными изменениями целевого элемента
			observer.observe(target, config);
		}// --- END Повторная попытка подключения, если DOM body изменился
	});
} // обл. вид.
