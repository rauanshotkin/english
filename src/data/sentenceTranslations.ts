export type SentenceTranslation = { ru: string; kk: string };

// Translations of our original educational summaries, available offline.
// English keys match the sentences in book.ts exactly.
const entries = `
Childhood gives people a special kind of attention.|Детство дарит людям особую внимательность.|Балалық шақ адамға ерекше зейін береді.
A child may notice a strange shape, ask an unexpected question, or imagine a story inside an ordinary object.|Ребёнок может заметить необычную форму, задать неожиданный вопрос или вообразить историю внутри обычного предмета.|Бала өзгеше пішінді байқап, күтпеген сұрақ қойып немесе қарапайым заттың ішінде бір оқиғаны елестете алады.
In The Little Prince, this ability becomes an important way of understanding the world.|В «Маленьком принце» эта способность становится важным способом понимать мир.|«Кішкентай ханзадада» бұл қабілет әлемді түсінудің маңызды тәсіліне айналады.
The narrator remembers how difficult it was to share his imagination with adults.|Рассказчик вспоминает, как трудно было делиться своим воображением со взрослыми.|Баяндаушы ересектермен қиялын бөлісудің қаншалықты қиын болғанын еске алады.
The adults around him prefer practical explanations.|Взрослые вокруг него предпочитают практические объяснения.|Оның айналасындағы ересектер іс жүзіндегі түсіндірмелерді жөн көреді.
They want clear information and familiar answers.|Им нужна ясная информация и привычные ответы.|Олар анық ақпарат пен таныс жауаптарды қалайды.
Their habits are useful in everyday life, but they can also make the world feel smaller.|Их привычки полезны в повседневной жизни, но могут также сужать представление о мире.|Олардың әдеттері күнделікті өмірде пайдалы, бірақ әлемді тар етіп көрсетуі де мүмкін.
The narrator gradually learns to hide some of his ideas, even though those ideas still matter to him.|Рассказчик постепенно учится скрывать некоторые свои идеи, хотя они по-прежнему для него важны.|Баяндаушы кейбір ойлары өзі үшін әлі де маңызды болса да, оларды біртіндеп жасыруды үйренеді.
This opening theme asks the reader to look again.|Эта вступительная тема приглашает читателя взглянуть ещё раз.|Бұл бастапқы тақырып оқырманды қайта қарауға шақырады.
Understanding another person takes more than collecting facts.|Чтобы понять другого человека, недостаточно просто собрать факты.|Басқа адамды түсіну үшін деректерді жинау ғана жеткіліксіз.
It also takes curiosity, patience, and the courage to admit that our first impression may be wrong.|Для этого нужны также любознательность, терпение и смелость признать, что наше первое впечатление может быть ошибочным.|Оған білуге құмарлық, шыдамдылық және алғашқы әсеріміз қате болуы мүмкін екенін мойындауға батылдық та қажет.
A problem with his aircraft leaves the narrator alone in a desert.|Из-за неисправности самолёта рассказчик остаётся один в пустыне.|Ұшағындағы ақау баяндаушыны шөлде жалғыз қалдырады.
He has little water and a difficult repair ahead of him.|У него мало воды, а впереди — сложный ремонт.|Оның суы аз, ал алдында күрделі жөндеу жұмысы тұр.
This place seems empty, yet it creates space for a surprising meeting.|Это место кажется пустым, но именно здесь появляется возможность неожиданной встречи.|Бұл жер бос көрінгенімен, таңғаларлық кездесуге жол ашады.
A young traveler appears, and his questions lead the narrator away from the usual concerns of adult life.|Появляется юный путешественник, и его вопросы отвлекают рассказчика от привычных забот взрослой жизни.|Жас саяхатшы пайда болып, оның сұрақтары баяндаушыны ересек өмірдің әдеттегі мәселелерінен алыстатады.
The traveler speaks about a very small home and the things he cares for there.|Путешественник рассказывает о своём совсем маленьком доме и о том, за чем он там ухаживает.|Саяхатшы өте кішкентай үйі және ондағы өзі қамқорлық жасайтын нәрселер туралы айтады.
His story arrives slowly, through questions and brief memories.|Его история раскрывается постепенно, через вопросы и короткие воспоминания.|Оның оқиғасы сұрақтар мен қысқа естеліктер арқылы біртіндеп ашылады.
The narrator cannot understand everything immediately.|Рассказчик не может сразу всё понять.|Баяндаушы бәрін бірден түсіне алмайды.
Instead, he must listen carefully and allow the conversation to move at its own pace.|Ему нужно внимательно слушать и позволить разговору развиваться в своём темпе.|Оның орнына ол мұқият тыңдап, әңгіменің өз қарқынымен жүруіне мүмкіндік беруі керек.
The desert brings two different needs together.|Пустыня соединяет две разные потребности.|Шөл екі түрлі қажеттілікті тоғыстырады.
One person needs to repair a machine; the other wants to understand people and relationships.|Одному нужно починить машину; другой хочет понять людей и отношения.|Біреуі машинаны жөндеуі керек, ал екіншісі адамдар мен қарым-қатынастарды түсінгісі келеді.
Their friendship suggests that a lonely place can become meaningful when someone is willing to listen.|Их дружба показывает, что даже одинокое место может обрести смысл, когда кто-то готов слушать.|Олардың достығы біреу тыңдауға дайын болса, жалғыз орынның да мағынаға тола алатынын көрсетеді.
On his small planet, the prince looks after a flower.|На своей маленькой планете принц ухаживает за цветком.|Ханзада өзінің кішкентай ғаламшарында гүлге қамқорлық жасайды.
She is beautiful, proud, and sometimes difficult to understand.|Она красива, горда, и порой её трудно понять.|Ол әдемі, тәкаппар, кейде оны түсіну қиын.
He wants to help her, but her words and behavior often confuse him.|Он хочет ей помочь, но её слова и поведение часто сбивают его с толку.|Ол оған көмектескісі келеді, бірақ гүлдің сөздері мен мінез-құлқы оны жиі шатастырады.
Neither of them knows how to express affection clearly, so small misunderstandings begin to feel like serious problems.|Никто из них не умеет ясно выражать привязанность, поэтому небольшие недопонимания начинают казаться серьёзными проблемами.|Екеуі де жақындығын анық білдіруді білмейді, сондықтан шағын түсінбеушіліктер үлкен мәселе болып көріне бастайды.
Distance changes the way he thinks about their relationship.|Расстояние меняет его представление об их отношениях.|Арақашықтық оның қарым-қатынастары туралы ойын өзгертеді.
He starts to notice the difference between a demanding sentence and a real need.|Он начинает замечать разницу между требовательными словами и настоящей потребностью.|Ол талапшыл сөз бен шынайы қажеттіліктің айырмашылығын байқай бастайды.
A person may sound confident while feeling vulnerable.|Человек может говорить уверенно, но при этом чувствовать себя уязвимым.|Адам өзін осал сезінсе де, сенімді сөйлей алады.
Caring for someone requires attention to both what they say and what they struggle to say.|Забота о ком-то требует внимания и к тому, что он говорит, и к тому, что ему трудно выразить.|Біреуге қамқор болу үшін оның айтқанына да, айтуға қиналғанына да назар аудару қажет.
The flower becomes a lesson about imperfect love.|Цветок становится уроком о несовершенной любви.|Гүл мінсіз емес махаббат туралы сабаққа айналады.
A relationship does not become valuable because every conversation is easy.|Ценность отношений не определяется тем, легко ли проходит каждый разговор.|Қарым-қатынастың құндылығы әр әңгіменің жеңіл өтуімен анықталмайды.
Its value grows through time, care, and a willingness to understand.|Её ценность растёт благодаря времени, заботе и желанию понять.|Оның құндылығы уақыт, қамқорлық және түсінуге деген ниет арқылы артады.
The prince begins to recognize this only after leaving home.|Принц начинает осознавать это лишь после ухода из дома.|Ханзада мұны үйінен кеткен соң ғана түсіне бастайды.
During his journey, the prince visits several tiny planets.|Во время путешествия принц посещает несколько крошечных планет.|Сапарында ханзада бірнеше өте кішкентай ғаламшарға барады.
Each one shows a different adult habit.|Каждая из них показывает одну из привычек взрослых.|Әрқайсысы ересектердің бір әдетін көрсетеді.
Some people want authority, some want admiration, and others are occupied with counting or owning things.|Одни хотят власти, другие — восхищения, а третьи заняты подсчётами или владением вещами.|Біреулер билікті, басқалар таңдануды қалайды, ал өзгелері заттарды санаумен немесе иеленумен айналысады.
Their interests fill their whole world, leaving very little room for a visitor or a new question.|Их интересы заполняют весь их мир, почти не оставляя места для гостя или нового вопроса.|Олардың қызығушылықтары бүкіл әлемін толтырып, қонаққа немесе жаңа сұраққа өте аз орын қалдырады.
The prince tries to understand these people without sharing their priorities.|Принц пытается понять этих людей, не разделяя их приоритетов.|Ханзада олардың басымдықтарын бөліспесе де, бұл адамдарды түсінуге тырысады.
He notices that power is less impressive when there is nobody to guide.|Он замечает, что власть впечатляет меньше, когда некого направлять.|Ол бағыттайтын ешкім болмаса, биліктің әсері азаятынын байқайды.
Praise feels empty when it is the only reason for a conversation.|Похвала кажется пустой, если она — единственная причина разговора.|Мақтау әңгіменің жалғыз себебі болса, ол мағынасыз сезіледі.
Possessions cannot replace the pleasure of actually experiencing something.|Обладание вещами не заменяет удовольствия от настоящего опыта.|Мүлікті иелену бір нәрсені шын сезінудің ләззатын алмастыра алмайды.
These encounters use humor to explore serious questions.|В этих встречах серьёзные вопросы раскрываются через юмор.|Бұл кездесулер маңызды сұрақтарды әзіл арқылы зерттейді.
What makes an activity worthwhile?|Что делает занятие стоящим?|Іс-әрекетті не құнды етеді?
How can a habit become a prison?|Как привычка может стать тюрьмой?|Әдет қалай түрмеге айналуы мүмкін?
The prince does not offer a complete answer, but his simple questions reveal the distance between being busy and living with purpose.|Принц не даёт исчерпывающего ответа, но его простые вопросы показывают разницу между занятостью и осмысленной жизнью.|Ханзада толық жауап бермейді, бірақ оның қарапайым сұрақтары бос болмау мен мақсатпен өмір сүрудің айырмасын ашады.
One person the prince meets has a task that helps others: caring for a lamp.|У одного из встреченных принцем людей есть полезное для других дело: забота о фонаре.|Ханзада кездескен бір адамның өзгелерге пайдалы міндеті бар: шамға күтім жасау.
The work is repetitive, and its rules no longer fit the changing world around him.|Работа повторяется снова и снова, а её правила уже не соответствуют меняющемуся миру вокруг него.|Жұмыс қайталана береді, ал оның ережелері айналасындағы өзгеріп жатқан әлемге енді сәйкес келмейді.
Even so, the prince respects the effort because it serves something beyond the worker himself.|И всё же принц уважает эти усилия, потому что они служат чему-то большему, чем интересы самого работника.|Соған қарамастан ханзада бұл күш-жігерді құрметтейді, өйткені ол жұмысшының өзінен де ауқымды нәрсеге қызмет етеді.
This encounter introduces a gentler view of responsibility.|Эта встреча открывает более мягкий взгляд на ответственность.|Бұл кездесу жауапкершілікке жұмсағырақ көзқарас ұсынады.
Another meeting raises questions about knowledge.|Другая встреча поднимает вопросы о знаниях.|Тағы бір кездесу білім туралы сұрақтар туғызады.
A map can describe mountains, rivers, and distant places, but a description is different from an experience.|Карта может описывать горы, реки и далёкие места, но описание отличается от личного опыта.|Карта тауларды, өзендерді және алыс жерлерді сипаттай алады, бірақ сипаттама тәжірибеден өзгеше.
Someone may know many facts about a journey without ever feeling its difficulties or discovering its surprises.|Можно знать много фактов о путешествии, ни разу не испытав его трудностей и не открыв его неожиданностей.|Адам сапар туралы көп дерек білсе де, оның қиындықтарын сезінбеуі немесе тосын сәттерін ашпауы мүмкін.
Together, these themes invite the reader to connect learning with action.|Вместе эти темы приглашают читателя соединить обучение с действием.|Бұл тақырыптар оқырманды оқуды әрекетпен байланыстыруға шақырады.
Useful knowledge grows when we test ideas, observe carefully, and stay open to change.|Полезные знания растут, когда мы проверяем идеи, внимательно наблюдаем и остаёмся открытыми переменам.|Идеяларды сынап, мұқият бақылап, өзгерістерге ашық болғанда пайдалы білім артады.
Rules and information can guide us, but they need attention to the living world they are meant to serve.|Правила и информация могут направлять нас, но требуют внимания к живому миру, которому должны служить.|Ережелер мен ақпарат бізге бағыт бере алады, бірақ олар қызмет етуге арналған тірі әлемге назар аударуды қажет етеді.
On Earth, the prince discovers that his flower is not the only flower of her kind.|На Земле принц узнаёт, что его цветок — не единственный в своём роде.|Жерде ханзада өз гүлінің сол түрдегі жалғыз гүл емес екенін біледі.
At first, this seems to make his home less special.|Сначала ему кажется, что из-за этого его дом становится менее особенным.|Алғашында бұл оның үйін бұрынғыдай ерекше етпейтіндей көрінеді.
He has confused being rare with being important.|Он перепутал редкость с важностью.|Ол сирек болуды маңызды болумен шатастырған.
Seeing many similar flowers forces him to question the story he has told himself about his own small world.|Множество похожих цветов заставляет его пересмотреть историю, которую он рассказывал себе о своём маленьком мире.|Көптеген ұқсас гүлді көру оны өз кішкентай әлемі туралы өзі айтқан оқиғаға күмәндануға мәжбүр етеді.
Yet appearance is only one part of a relationship.|Но внешний вид — лишь одна сторона отношений.|Дегенмен сыртқы көрініс — қарым-қатынастың бір бөлігі ғана.
Two objects can look alike while carrying very different memories.|Два предмета могут выглядеть одинаково, но хранить совершенно разные воспоминания.|Екі зат бір-біріне ұқсаса да, мүлде басқа естеліктермен байланысты болуы мүмкін.
A familiar cup, a worn book, or a quiet place may matter because of the time and attention connected to it.|Знакомая чашка, потёртая книга или тихое место могут быть важны благодаря связанным с ними времени и вниманию.|Таныс кесе, тозған кітап немесе тыныш орын өзімен байланысты уақыт пен назардың арқасында маңызды болуы мүмкін.
Its importance cannot be measured by comparing its surface with another.|Его важность нельзя измерить, сравнив его внешний вид с другим.|Оның маңызын сыртқы көрінісін басқасымен салыстыру арқылы өлшеу мүмкін емес.
The prince is beginning to learn this distinction.|Принц начинает понимать это различие.|Ханзада осы айырмашылықты түсіне бастайды.
His flower has a shared history with him.|У него и его цветка есть общая история.|Оның гүлі екеуінің ортақ тарихы бар.
That history does not make other flowers worthless; it gives their particular relationship a meaning that comparison alone cannot explain.|Эта история не делает другие цветы неценными; она придаёт именно их отношениям смысл, который нельзя объяснить одним лишь сравнением.|Бұл тарих басқа гүлдерді құнсыз етпейді; ол олардың ерекше қарым-қатынасына салыстырумен ғана түсіндіруге болмайтын мағына береді.
A meeting with a fox gives the prince a new understanding of friendship.|Встреча с лисой помогает принцу по-новому понять дружбу.|Түлкімен кездесу ханзадаға достық туралы жаңа түсінік береді.
Trust cannot be demanded or completed in a single moment.|Доверие нельзя потребовать или выстроить за одно мгновение.|Сенімді талап етуге немесе бір сәтте қалыптастырып бітіруге болмайды.
It develops through patient attention, repeated meetings, and respect for another creature’s comfort.|Оно развивается через терпеливое внимание, регулярные встречи и уважение к спокойствию другого существа.|Ол шыдамды назар, қайталанатын кездесулер және басқа тіршілік иесінің жайлылығын құрметтеу арқылы дамиды.
Small routines help both sides feel safe enough to become closer.|Небольшие привычные действия помогают обоим почувствовать достаточную безопасность, чтобы сблизиться.|Шағын әдеттер екі жаққа да жақындасу үшін өздерін жеткілікті қауіпсіз сезінуге көмектеседі.
As the friendship grows, ordinary details gain new meaning.|По мере развития дружбы обычные детали обретают новый смысл.|Достық нығайған сайын қарапайым бөлшектер жаңа мағынаға ие болады.
A sound, a color, or a certain time of day can remind someone of a person they love.|Звук, цвет или определённое время суток могут напоминать о любимом человеке.|Дыбыс, түс немесе күннің белгілі бір мезгілі адамға жақсы көретін жанын еске салуы мүмкін.
The outside world becomes connected to a private experience.|Внешний мир связывается с личным переживанием.|Сыртқы әлем жеке тәжірибемен байланысады.
This is why a relationship can change how we notice things even when the things themselves stay the same.|Поэтому отношения могут менять то, как мы замечаем вещи, даже если сами вещи остаются прежними.|Сондықтан заттардың өзі өзгермесе де, қарым-қатынас оларды байқау тәсілімізді өзгерте алады.
Friendship also brings the possibility of sadness.|Дружба приносит также возможность печали.|Достық мұңға бату мүмкіндігін де әкеледі.
Being close to someone makes separation difficult.|Близость с кем-то делает расставание трудным.|Біреуге жақын болу айырылысуды қиындатады.
The story accepts this cost while showing why the connection remains valuable.|История признаёт эту цену и одновременно показывает, почему связь остаётся ценной.|Оқиға бұл құнды қабылдай отырып, байланыстың неліктен құнды болып қалатынын көрсетеді.
Care is a practice, and the time we give to it shapes our lives.|Забота — это постоянное действие, а время, которое мы ей уделяем, формирует нашу жизнь.|Қамқорлық — үнемі жасалатын әрекет, ал оған бөлген уақытымыз өмірімізді қалыптастырады.
Near the end of the journey, the prince thinks about returning to his flower.|Ближе к концу путешествия принц думает о возвращении к своему цветку.|Сапарының соңына қарай ханзада өз гүліне оралуды ойлайды.
The narrator must also return to his own life.|Рассказчику тоже нужно вернуться к своей жизни.|Баяндаушы да өз өміріне оралуы керек.
Their shared days in the desert have changed them, but they cannot keep that moment forever.|Совместные дни в пустыне изменили их, но они не могут сохранить этот момент навсегда.|Шөлде бірге өткізген күндері оларды өзгертті, бірақ олар сол сәтті мәңгі сақтай алмайды.
The ending leaves room for uncertainty, memory, and different ways of understanding a goodbye.|Концовка оставляет место для неопределённости, воспоминаний и разных пониманий прощания.|Соңы белгісіздікке, естелікке және қоштасуды әртүрлі түсінуге орын қалдырады.
For the narrator, the world now contains reminders of his friend.|Теперь мир напоминает рассказчику о его друге.|Енді әлем баяндаушыға досын еске салатын белгілерге толы.
The night sky becomes connected to conversations, laughter, and care.|Ночное небо связывается с разговорами, смехом и заботой.|Түнгі аспан әңгімелермен, күлкімен және қамқорлықпен байланысады.
He has learned to take a child’s questions seriously and to recognize forms of value that practical explanations cannot fully describe.|Он научился серьёзно относиться к детским вопросам и замечать ценности, которые практические объяснения не могут полностью описать.|Ол баланың сұрақтарына байыппен қарап, іс жүзіндегі түсіндірмелер толық сипаттай алмайтын құндылықтарды тануды үйренді.
The lasting invitation of the story is to remain attentive.|Неугасающий призыв этой истории — оставаться внимательным.|Бұл оқиғаның ұзақ сақталатын үндеуі — зейінді болып қалу.
We can make time for people, ask better questions, and notice what a familiar routine hides.|Мы можем находить время для людей, задавать более точные вопросы и замечать то, что скрывает привычный порядок.|Біз адамдарға уақыт бөліп, жақсырақ сұрақтар қойып, таныс күнделікті тәртіптің нені жасыратынын байқай аламыз.
Growing older does not have to mean losing imagination.|Становиться старше не обязательно значит терять воображение.|Есею қиялды жоғалту дегенді білдірмейді.
A meaningful life can hold both everyday responsibilities and the ability to wonder.|В осмысленной жизни есть место и повседневным обязанностям, и способности удивляться.|Мағыналы өмір күнделікті жауапкершілікті де, таңдану қабілетін де қамти алады.
`
  .trim()
  .split("\n")
  .map((line) => line.split("|"));

export const sentenceTranslations: Record<string, SentenceTranslation> =
  Object.fromEntries(entries.map(([english, ru, kk]) => [english, { ru, kk }]));

const phraseEntries = `
special kind of attention|особая внимательность|ерекше зейін
an unexpected question|неожиданный вопрос|күтпеген сұрақ
an ordinary object|обычный предмет|қарапайым зат
understanding the world|понимание мира|әлемді түсіну
share his imagination|делиться своим воображением|қиялын бөлісу
practical explanations|практические объяснения|іс жүзіндегі түсіндірмелер
familiar answers|привычные ответы|таныс жауаптар
everyday life|повседневная жизнь|күнделікті өмір
look again|взглянуть ещё раз|қайта қарау
collecting facts|сбор фактов|деректерді жинау
first impression|первое впечатление|алғашқы әсер
alone in a desert|один в пустыне|шөлде жалғыз
a surprising meeting|неожиданная встреча|таңғаларлық кездесу
a young traveler|юный путешественник|жас саяхатшы
adult life|взрослая жизнь|ересек өмір
brief memories|короткие воспоминания|қысқа естеліктер
listen carefully|внимательно слушать|мұқият тыңдау
at its own pace|в своём темпе|өз қарқынымен
willing to listen|готов слушать|тыңдауға дайын
looks after|ухаживает за|қамқорлық жасайды
express affection|выражать привязанность|жақындығын білдіру
small misunderstandings|небольшие недопонимания|шағын түсінбеушіліктер
serious problems|серьёзные проблемы|күрделі мәселелер
a real need|настоящая потребность|шынайы қажеттілік
feeling vulnerable|чувствуя себя уязвимым|өзін осал сезіну
imperfect love|несовершенная любовь|мінсіз емес махаббат
a willingness to understand|желание понять|түсінуге деген ниет
leaving home|уход из дома|үйден кету
tiny planets|крошечные планеты|өте кішкентай ғаламшарлар
adult habit|привычка взрослых|ересектердің әдеті
their priorities|их приоритеты|олардың басымдықтары
the only reason|единственная причина|жалғыз себеп
serious questions|серьёзные вопросы|маңызды сұрақтар
living with purpose|осмысленная жизнь|мақсатпен өмір сүру
caring for a lamp|уход за фонарём|шамға күтім жасау
no longer fit|больше не соответствуют|енді сәйкес келмейді
the changing world|меняющийся мир|өзгеріп жатқан әлем
view of responsibility|взгляд на ответственность|жауапкершілікке көзқарас
distant places|далёкие места|алыс жерлер
connect learning with action|соединять обучение с действием|оқуды әрекетпен байланыстыру
useful knowledge|полезные знания|пайдалы білім
observe carefully|внимательно наблюдать|мұқият бақылау
open to change|открытый переменам|өзгерістерге ашық
at first|сначала|алғашында
less special|менее особенный|соншалықты ерекше емес
similar flowers|похожие цветы|ұқсас гүлдер
look alike|выглядеть одинаково|ұқсас көріну
a worn book|потёртая книга|тозған кітап
a quiet place|тихое место|тыныш орын
shared history|общая история|ортақ тарих
understanding of friendship|понимание дружбы|достық туралы түсінік
in a single moment|за одно мгновение|бір сәтте
patient attention|терпеливое внимание|шыдамды назар
repeated meetings|регулярные встречи|қайталанатын кездесулер
feel safe|чувствовать себя в безопасности|өзін қауіпсіз сезіну
ordinary details|обычные детали|қарапайым бөлшектер
new meaning|новый смысл|жаңа мағына
the outside world|внешний мир|сыртқы әлем
a private experience|личное переживание|жеке тәжірибе
stay the same|оставаться прежними|өзгеріссіз қалу
remains valuable|остаётся ценным|құнды болып қалады
shapes our lives|формирует нашу жизнь|өмірімізді қалыптастырады
returning to his flower|возвращение к своему цветку|өз гүліне оралу
leaves room|оставляет место|орын қалдырады
the night sky|ночное небо|түнгі аспан
remain attentive|оставаться внимательным|зейінді болып қалу
make time for people|находить время для людей|адамдарға уақыт бөлу
growing older|становиться старше|есею
losing imagination|терять воображение|қиялды жоғалту
a meaningful life|осмысленная жизнь|мағыналы өмір
everyday responsibilities|повседневные обязанности|күнделікті жауапкершілік
the ability to wonder|способность удивляться|таңдану қабілеті
`
  .trim()
  .split("\n")
  .map((line) => line.split("|"));

export const phraseTranslations: Record<string, SentenceTranslation> =
  Object.fromEntries(
    phraseEntries.map(([english, ru, kk]) => [english, { ru, kk }]),
  );
