// =====================================================
// 0. YARDIMCI FONKSİYONLAR
// =====================================================
function lsGet(k, def) {
    try { const v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; }
}
function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* özel mod vb. */ }
}
function lsInt(k, def) {
    const n = parseInt(lsGet(k, ''), 10);
    return isNaN(n) ? def : n;
}
function lsJSON(k) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function lsRemove(k) {
    try { localStorage.removeItem(k); } catch (e) { /* yoksay */ }
}

// Türkçe karakterlere duyarsız arama için normalleştirme
function norm(s) {
    return String(s).toLocaleLowerCase('tr')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/ı/g, 'i').replace(/['’`]/g, '');
}

const AYLAR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const GUNLER = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const HICRI_AYLAR = ["Muharrem","Safer","Rebiülevvel","Rebiülahir","Cemaziyelevvel","Cemaziyelahir","Recep","Şaban","Ramazan","Şevval","Zilkade","Zilhicce"];

function pad2(n) { return String(n).padStart(2, '0'); }

function bugunIso() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function tarihYaz(iso, gunAdi) {
    const d = new Date(iso + 'T12:00:00Z');
    let s = d.getUTCDate() + ' ' + AYLAR[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    if (gunAdi !== false) s += ' ' + GUNLER[d.getUTCDay()];
    return s;
}

function yerelGunBasi(iso) {
    const p = iso.split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 0, 0, 0);
}

// =====================================================
// 1. ZİKİRMATİK
// =====================================================
let zikirSayisi = lsInt('zikirCount', 0);
let zikirTur = lsInt('zikirTur', 0);
let zikirToplam = lsInt('zikirToplam', 0);
let zikirHedef = lsInt('zikirHedef', 33);
let zikirMsgTimer = null;

function zikirCiz() {
    document.getElementById('zikir-sayac').innerText = zikirSayisi;
    document.getElementById('zikir-tur').innerText = zikirTur;
    document.getElementById('zikir-toplam').innerText = zikirToplam;
    const bar = document.getElementById('zikir-bar');
    if (zikirHedef > 0) {
        const kalan = zikirSayisi % zikirHedef;
        const yuzde = (zikirSayisi > 0 && kalan === 0) ? 100 : (kalan / zikirHedef) * 100;
        bar.style.width = yuzde + '%';
    } else {
        bar.style.width = '0%';
    }
    document.querySelectorAll('#hedef-chips .chip').forEach(c => {
        c.classList.toggle('active', parseInt(c.dataset.hedef, 10) === zikirHedef);
    });
}

function zikirKaydet() {
    lsSet('zikirCount', zikirSayisi);
    lsSet('zikirTur', zikirTur);
    lsSet('zikirToplam', zikirToplam);
    lsSet('zikirHedef', zikirHedef);
}

function zikirMesaj(metin) {
    const el = document.getElementById('zikir-msg');
    el.innerText = metin;
    clearTimeout(zikirMsgTimer);
    zikirMsgTimer = setTimeout(() => { el.innerText = ''; }, 2000);
}

function zikirArtir() {
    zikirSayisi++;
    zikirToplam++;
    const sayacEl = document.getElementById('zikir-sayac');

    // Profesyonel animasyon efekti
    sayacEl.classList.add('anim');
    setTimeout(() => sayacEl.classList.remove('anim'), 100);

    if (zikirHedef > 0 && zikirSayisi % zikirHedef === 0) {
        zikirTur++;
        zikirMesaj('✓ ' + zikirHedef + ' tamamlandı! (' + zikirTur + '. tur)');
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
    } else if (navigator.vibrate) {
        navigator.vibrate(40);
    }
    zikirCiz();
    zikirKaydet();
}

function zikirGeriAl() {
    if (zikirSayisi <= 0) return;
    if (zikirHedef > 0 && zikirSayisi % zikirHedef === 0 && zikirTur > 0) zikirTur--;
    zikirSayisi--;
    if (zikirToplam > 0) zikirToplam--;
    zikirCiz();
    zikirKaydet();
}

function zikirHedefSec(h) {
    zikirHedef = h;
    zikirCiz();
    zikirKaydet();
}

function zikirSifirla() {
    if (confirm("Sayaç, tur ve toplam değerleri sıfırlansın mı?")) {
        zikirSayisi = 0;
        zikirTur = 0;
        zikirToplam = 0;
        zikirCiz();
        zikirKaydet();
    }
}

// =====================================================
// 2. HİKMETLİ SÖZLER
// =====================================================
const sozler = [
    "Küstahlığın teessürü ancak kendinedir.",
    "Mum olmak kolay değildir, ışık saçmak için önce yanmak gerekir.",
    "Gel, ne olursan ol yine gel.",
    "Dünle beraber gitti cancağızım, ne kadar söz varsa düne ait. Şimdi yeni şeyler söylemek lazım.",
    "Kalp denizdir, dil kıyı. Denizde ne varsa kıyıya o vurur."
];
let sonSozIndex = 0;
function yeniSozGetir() {
    let r = sonSozIndex;
    if (sozler.length > 1) {
        while (r === sonSozIndex) r = Math.floor(Math.random() * sozler.length);
    }
    sonSozIndex = r;
    document.getElementById('mesnevi-soz').innerText = '"' + sozler[r] + '"';
}

// =====================================================
// 3. NAMAZ DUALARI VE SURELER
// =====================================================
const tumDualarVeSureler = {
    dualari: [
        { 
            baslik: "Sübhâneke Duası", 
            arapca: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلاَ إِلَهَ غَيْرُكَ", 
            okunus: "Subhânekellâhumme ve bi hamdike ve tebârakesmuke ve teâlâ cedduke (ve celle senâuke)* ve lâ ilâhe ğayruk.", 
            anlam: "Allah'ım! Sen eksik sıfatlardan münezzehsin, seni hamd ile tesbih ederim. İsmin mübarektir, varlığın yücedir. Senden başka ilah yoktur. (*ve celle senâuke kısmı sadece cenaze namazında okunur)" 
        },
        { 
            baslik: "Ettehiyyâtü Duası", 
            arapca: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ اَلسَّلاَمُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ اَلسَّلاَمُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ", 
            okunus: "Ettehiyyâtu lillâhi ves-salavâtu vet-tayyibât. Es-selâmu 'aleyke eyyuhen-nebiyyu ve rahmetullâhi ve berakâtuh. Es-selâmu 'aleynâ ve 'alâ 'ibâdillâhis-sâlihîn. Eşhedu en lâ ilâhe illallâh ve eşhedu enne Muhammeden 'abduhû ve rasûluh.", 
            anlam: "Her türlü hürmet, ibadet ve tayyib kelimeler Allah'adır. Ey Peygamber! Selam, Allah'ın rahmeti ve bereketleri senin üzerine olsun. Selam bizlere ve Allah'ın salih kullarına olsun. Şahitlik ederim ki Allah'tan başka ilah yoktur ve yine şahitlik ederim ki Hz. Muhammed O'nun kulu ve elçisidir." 
        },
        { 
            baslik: "Allahümme Salli Duası", 
            arapca: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ", 
            okunus: "Allâhumme salli 'alâ Muhammedin ve 'alâ âli Muhammed. Kemâ salleyte 'alâ İbrâhîme ve 'alâ âli İbrâhîm. İnneke hamîdun mecîd.", 
            anlam: "Allah'ım! Hz. İbrahim'e ve âline rahmet ettiğin gibi Hz. Muhammed'e ve âline de rahmet eyle. Şüphesiz sen övülmeye layıksın, şanı yüce olansın." 
        },
        { 
            baslik: "Allahümme Bârik Duası", 
            arapca: "اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ", 
            okunus: "Allâhumme bârik 'alâ Muhammedin ve 'alâ âli Muhammed. Kemâ Bârakte 'alâ İbrâhîme ve 'alâ âli İbrâhîm. İnneke hamîdun mecîd.", 
            anlam: "Allah'ım! Hz. İbrahim'e ve âline bereket verdiğin gibi Hz. Muhammed'e ve âline de bereket ver. Şüphesiz sen övülmeye layıksın, şanı yüce olansın." 
        },
        { 
            baslik: "Rabbenâ Âtinâ Duası", 
            arapca: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", 
            okunus: "Rabbenâ âtinâ fid-dunyâ haseneten ve fil-âhirati haseneten ve qinâ 'azâben-nâr.", 
            anlam: "Rabbimiz! Bize dünyada da iyilik ve güzellik ver, ahirette de iyilik ve güzellik ver. Bizi cehennem azabından koru." 
        },
        { 
            baslik: "Rabbenâğfirlî Duası", 
            arapca: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ", 
            okunus: "Rabbenâğfirlî ve li-vâlideyye ve lil-mu'minîne yevme yeqûmul-hisâb.", 
            anlam: "Rabbimiz! Hesabın görüleceği gün beni, anne ve babamı ve bütün müminleri bağışla." 
        },
        { 
            baslik: "Kunut Duaları - 1", 
            arapca: "اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ وَنُؤْمِنُ بِكَ وَنَتُوبُ إِلَيْكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ نَشْكُرُكَ وَلاَ نَكْفُرُكَ وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ", 
            okunus: "Allâhumme innâ neste'înuke ve nesteğfiruke ve nestehdîk. Ve nu'minu bike ve netûbu ileyk. Ve netevekkelu 'aleyke ve nusnî 'aleykel-hayra kullehu neşkuruke ve lâ nekfuruk. Ve nahle'u ve netruku men yefjuruk.", 
            anlam: "Allah'ım! Biz senden yardım dileriz, günahlarımızı bağışlamanı isteriz, razı olduğun doğru yola iletmeni isteriz. Sana iman ederiz, sana tövbe ederiz, sana güveniriz. Seni bütün hayırlarla överiz. Sana şükrederiz, nankörlük etmeyiz. Sana karşı geleni bırakır ve terk ederiz." 
        },
        { 
            baslik: "Kunut Duaları - 2", 
            arapca: "اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ وَإِلَيْكَ نَسْعَى وَنَحْفِدُ نَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ", 
            okunus: "Allâhumme iyyâke na'budu ve leke nusallî ve nesjudu ve ileyke nes'â ve nahfid. Nercû rahmeteke ve nahşâ 'azâbek. İnne 'azâbeke bil-kuffâri mulhiq.", 
            anlam: "Allah'ım! Biz ancak sana kulluk ederiz. Senin için namaz kılar ve secde ederiz. Sana yönelir ve sana koşarız. Rahmetini umar, azabından korkarız. Şüphesiz senin azabın kafirlere ulaşacaktır." 
        }
    ],
    sureler: [
        {
            baslik: "Fâtiha Suresi",
            arapca: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اِهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلاَ الضَّالِّينَ ﴿٧﴾",
            okunus: "Bismillâhir-rahmânir-rahîm. El-hamdu lillâhi rabbil-'âlemîn. Er-rahmânir-rahîm. Mâliki yevmid-dîn. İyyâke na'budu ve iyyâke neste'în. İhdinâs-sırâtal-mustaqîm. Sırâtallezîne en'amte 'aleyhim ğayril-mağdûbi 'aleyhim ve lad-dâllîn.",
            anlam: "Rahmân ve Rahîm olan Allah'ın adıyla. Hamd, âlemlerin Rabbi, Rahmân, Rahîm ve din gününün mâliki olan Allah'a mahsustur. Yalnız sana kulluk eder ve yalnız senden yardım dileriz. Bizi dosdoğru yola ilet; kendilerine nimet verdiklerinin yoluna, gazaba uğrayanların ve sapanların yoluna değil."
        },
        {
            baslik: "Ayet-el Kürsi (Bakara 255)",
            arapca: "اللَّهُ لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلاَّ بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلاَ يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلاَّ بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ وَلاَ يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
            okunus: "Allâhu lâ ilâhe illâ huvel-hayyul-qayyûm. Lâ te'huzuhû sinetun ve lâ nevm. Lehû mâ fis-semâvâti ve mâ fil-ard. Men zellezî yeşfe'u 'indehû illâ bi-iznih. Ya'lemu mâ beyne eydîhim ve mâ halfehum. Ve lâ yuhîtûne bi-şey'im min 'ilmihî illâ bimâ şâ'. Vesi'a kursiyyuhus-semâvâti vel-ard. Ve lâ ye'ûduhû hifzuhumâ ve huvel-'aliyyul-'azîm.",
            anlam: "Allah, O'ndan başka hiçbir ilah yoktur. O daima diridir, bütün varlığın idaresini yürütendir. O'nu ne bir uyuklama tutar ne de uyku. Göklerde ve yerde ne varsa hepsi O'nundur. O'nun izni olmadan katında kim şefaat edebilir? Onların önlerindekini ve arkalarındakini bilir. O'nun dilediği kadarından başka ilminden hiçbir şeyi kavrayamazlar. O'nun kürsüsü gökleri ve yeri kaplamıştır. Onları koruyup gözetmek O'na ağır gelmez. O çok yücedir, çok büyüktür."
        },
        {
            baslik: "İnşirah Suresi",
            arapca: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ ﴿١﴾ وَوَضَعْنَا عَنْكَ وِزْرَكَ ﴿٢﴾ الَّذِي أَنْقَضَ ظَهْرَكَ ﴿٣﴾ وَرَفَعْنَا لَكَ ذِكْرَكَ ﴿٤﴾ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٥﴾ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴿٦﴾ فَإِذَا فَرَغْتَ فَانْصَبْ ﴿٧﴾ وَإِلَى رَبِّكَ فَارْغَبْ ﴿٨﴾",
            okunus: "Bismillâhir-rahmânir-rahîm. E lem neşrah leke sadrak. Ve vada'nâ 'anke vizrak. Ellezî enqada zahrak. Ve rafa'nâ leke zikrak. Fe inne ma'al-usri yusrâ. İnne ma'al-usri yusrâ. Fe izâ ferağte fensab. Ve ilâ rabbike farğab.",
            anlam: "Rahmân ve Rahîm olan Allah'ın adıyla. Senin göğsünü açıp genişletmedik mi? Belini büken o yükü senden alıp indirmedik mi? Senin şanını ve adını yüceltmedik mi? Elbette zorlukla beraber bir kolaylık vardır. Gerçekten, zorlukla beraber bir kolaylık vardır. Öyleyse bir işi bitirince diğerine koyul ve yalnız Rabbine yönel."
        },
        {
            baslik: "Ahzab Suresi - 35. Ayet",
            arapca: "إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ وَالْقَانِتِينَ وَالْقَانِتَاتِ وَالصَّادِقِينَ وَالصَّادِقَاتِ وَالصَّابِرِينَ وَالصَّابِرَاتِ وَالْخَاشِعِينَ وَالْخَاشِعَاتِ وَالْمُتَصَدِّقِينَ وَالْمُتَصَدِّقَاتِ وَالصَّائِمِينَ وَالصَّائِمَاتِ وَالْحَافِظِينَ فُرُوجَهُمْ وَالْحَافِظَاتِ وَالذَّاكِرِينَ اللَّهَ كَثِيرًا وَالذَّاكِرَاتِ أَعَدَّ اللَّهُ لَهُمْ مَغْفِرَةً وَأَجْرًا عَظِيمًا",
            okunus: "İnnel-muslimîne vel-muslimâti vel-mu'minîne vel-mu'minâti vel-qânitîne vel-qânitâti ves-sâdıqîne ves-sâdıqâti ves-sâbirîne ves-sâbirâti vel-hâşi'îne vel-hâşi'âti vel-mutasaddiqîne vel-mutasaddiqâti ves-sâimîne ves-sâimâti vel-hâfizîne furûcehum vel-hâfizâti vez-zâkirînallâhe kesîran vez-zâkirâti e'addallâhu lehum mağfireten ve ajran azîmâ.",
            anlam: "Şüphesiz Müslüman erkeklerle Müslüman kadınlar, mümin erkeklerle mümin kadınlar, itaat eden erkeklerle itaat eden kadınlar, doğru olan erkeklerle doğru olan kadınlar, sabreden erkeklerle sabreden kadınlar, mütevazı olan erkeklerle mütevazı olan kadınlar, sadaka veren erkeklerle sadaka veren kadınlar, oruç tutan erkeklerle oruç tutan kadınlar, iffetlerini koruyan erkeklerle iffetlerini koruyan kadınlar, Allah'ı çokça zikreden erkekler ve zikreden kadınlar var ya; işte onlar için Allah bir bağışlanma ve büyük bir mükâfat hazırlamıştır."
        },
        {
            baslik: "Fil Suresi",
            arapca: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ ﴿١﴾ أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ ﴿٢﴾ وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ ﴿٣﴾ تَرْمِيهِمْ بِحِجَارَةٍ مِنْ سِجِّيلٍ ﴿٤﴾ فَجَعَلَهُمْ كَعَصْفٍ مَأْكُولٍ ﴿٥﴾",
            okunus: "E lem tera keyfe fe'ala rabbuke bi-ashâbil-fîl. E lem yec'al keydehum fî tadlîl. Ve ersele 'aleyhim tayran ebâbîl. Termîhim bi-hicâratim min siccîl. Fe-ce'alehum ke'asfim me'kûl.",
            anlam: "Rabbinin fil sahiplerine ne yaptığını görmedin mi? Onların tuzaklarını boşa çıkarmadı mı? Üzerlerine sürü sürü kuşlar gönderdi. Onlara çamurdan pişirilmiş sert taşlar atıyorlardı. Nihayet onları yenilmiş ekin yaprağı gibi yaptı."
        },
        {
            baslik: "Kureyş Suresi",
            arapca: "لإِيلاَفِ قُرَيْشٍ ﴿١﴾ إِيلاَفِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ ﴿٢﴾ فَلْيَعْبُدُوا رَبَّ هَذَا الْبَيْتِ ﴿٣﴾ الَّذِي أَطْعَمَهُمْ مِنْ جُوعٍ وَآمَنَهُمْ مِنْ خَوْفٍ ﴿٤﴾",
            okunus: "Li-îlâfi qurayş. Îlâfihim rihleteş-şitâ'i ves-sayf. Fel-ya'budû rabbe hâzal-beyt. Ellezî at'amehum min cû'in ve âmenehum min havf.",
            anlam: "Kureyş'i ısındırıp alıştırdığı için; kış ve yaz yolculuklarına alıştırdığı için, onlar da bu Ev'in (Kâbe'nin) Rabbine kulluk etsinler; ki O, kendilerini açlıktan doyurmuş ve korkudan emin kılmıştır."
        },
        {
            baslik: "Mâûn Suresi",
            arapca: "أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ ﴿١﴾ فَذَلِكَ الَّذِي يَدُعُّ الْيَتِيمَ ﴿٢﴾ وَلاَ يَحُضُّ عَلَى طَعَامِ الْمِسْكِينِ ﴿٣﴾ فَوَيْلٌ لِلْمُصَلِّينَ ﴿٤﴾ الَّذِينَ هُمْ عَنْ صَلاَتِهِمْ سَاهُونَ ﴿٥﴾ الَّذِينَ هُمْ يُرَاؤُونَ ﴿٦﴾ وَيَمْنَعُونَ الْمَاعُونَ ﴿٧﴾",
            okunus: "E re'aytellezî yukezzibu bid-dîn. Fe-zâlikellezî yedu''ul-yetîm. Ve lâ yahuddu 'alâ ta'âmil-miskîn. Fe-veylul lil-musallîn. Ellezîne hum 'an salâtihim sâhûn. Ellezîne hum yurâ'ûn. Ve yemne'ûnel-mâ'ûn.",
            anlam: "Dini yalanlayanı gördün mü? İşte o, yetimi itip kakar. Yoksulu doyurmaya teşvik etmez. Yazıklar olsun o namaz kılanlara ki, onlar namazlarından gafildirler. Onlar gösteriş yaparlar ve en ufak bir yardımı (zekatı/yardımlaşmayı) bile engellerler."
        },
        {
            baslik: "Kevser Suresi",
            arapca: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ ﴿١﴾ فَصَلِّ لِرَبِّكَ وَانْحَرْ ﴿٢﴾ إِنَّ شَانِئَكَ هُوَ الأَبْتَرُ ﴿٣﴾",
            okunus: "İnnâ a'taynâkel-kevser. Fe-salli li-rabbike venhar. İnne şâni'eke huvel-ebter.",
            anlam: "Şüphesiz biz sana Kevser'i verdik. Sen de Rabbin için namaz kıl ve kurban kes. Asıl soyu kesik olan, sana kin besleyendir."
        },
        {
            baslik: "Kâfirûn Suresi",
            arapca: "قُلْ يَا أَيُّهَا الْكَافِرُونَ ﴿١﴾ لاَ أَعْبُدُ مَا تَعْبُدُونَ ﴿٢﴾ وَلاَ أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٣﴾ وَلاَ أَنَا عَابِدٌ مَا عَبَدْتُمْ ﴿٤﴾ وَلاَ أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ ﴿٥﴾ لَكُمْ دِينُكُمْ وَلِيَ دِينِ ﴿٦﴾",
            okunus: "Qul yâ ayyuhel-kâfirûn. Lâ a'budu mâ ta'budûn. Ve lâ entum 'âbidûne mâ a'bud. Ve lâ ene 'âbidum mâ 'abedtum. Ve lâ entum 'âbidûne mâ a'bud. Lekum dînukum ve liye dîn.",
            anlam: "De ki: Ey kâfirler! Ben sizin taptıklarınıza tapmam. Siz de benim taptığıma tapacak değilsiniz. Ben de sizin taptıklarınıza tapacak değilim. Siz de benim taptığıma tapacak değilsiniz. Sizin dininiz size, benim dinim banadır."
        },
        {
            baslik: "Nasr Suresi",
            arapca: "إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ ﴿١﴾ وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا ﴿٢﴾ فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا ﴿٣﴾",
            okunus: "İzâ câ'a nasrullâhi vel-feth. Ve re'ayten-nâsa yedhulûne fî dînillâhi efvâcâ. Fe-sebbih bi-hamdi rabbike vesteğfirh. İnnehû kâne tevvâbâ.",
            anlam: "Allah'ın yardımı ve fetih geldiğinde; ve insanların dalga dalga Allah'ın dinine girdiklerini gördüğünde; hemen Rabbini hamd ile tesbih et ve O'ndan bağışlanma dile. Şüphesiz O, tövbeleri çokça kabul edendir."
        },
        {
            baslik: "Tebbet (Mesed) Suresi",
            arapca: "تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ ﴿١﴾ مَا أَغْنَى عَنْهُ مَالُهُ وَمَا كَسَبَ ﴿٢﴾ سَيَصْلَى نَارًا ذَاتَ لَهَبٍ ﴿٣﴾ وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ ﴿٤﴾ فِي جِيدِهَا حَبْلٌ مِنْ مَسَدٍ ﴿٥﴾",
            okunus: "Tebbet yedâ ebî lehebin ve tebb. Mâ ağnâ 'anhu mâluhû ve mâ keseb. Se-yaslâ nâran zâte leheb. Vemra'atuhû hammâletel-hatab. Fî cîdihâ hablum mim mesed.",
            anlam: "Ebu Leheb'in iki eli kurusun; kurudu da! Malı ve kazandıkları ona fayda vermedi. O, alevli bir ateşe girecektir. Odun taşıyıcı olarak karısı da. Boynunda bükülmüş hurma lifinden bir ip olduğu halde."
        },
        {
            baslik: "İhlâs Suresi",
            arapca: "قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ اللَّهُ الصَّمَدُ ﴿٢﴾ لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ ﴿٤﴾",
            okunus: "Qul huvallâhu ehad. Allâhus-samed. Lem yelid ve lem yûled. Ve lem yekun lehû kufuven ehad.",
            anlam: "De ki: O Allah tektir. Allah sameddir (her şey O'na muhtaçdır, O hiçbir şeye muhtaç değildir). O doğurmamış ve doğurulmamıştır. Hiçbir şey O'nun dengi ve benzeri değildir."
        },
        {
            baslik: "Felak Suresi",
            arapca: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ مِنْ شَرِّ مَا خَلَقَ ﴿٢﴾ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾",
            okunus: "Qul e'ûzu bi-rabbil-felaq. Min şerri mâ halaq. Ve min şerri ğâsiqin izâ veqab. Ve min şerrin-neffâsâti fil-'uqad. Ve min şerri hâsidin izâ hased.",
            anlam: "De ki: Yarattığı şeylerin şerrinden, karanlığı çöktüğü zaman gecenin şerrinden, düğümlere üfleyenlerin şerrinden ve haset ettiği zaman hasetçinin şerrinden sabahın Rabbine sığınırım."
        },
        {
            baslik: "Nâs Suresi",
            arapca: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ مَلِكِ النَّاسِ ﴿٢﴾ إِلَهِ النَّاسِ ﴿٣﴾ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾",
            okunus: "Qul e'ûzu bi-rabbin-nâs. Melikin-nâs. İlâhin-nâs. Min şerril-vesvâsil-hannâs. Ellezî yuvesvisu fî sudûrin-nâs. Minel-cinneti ven-nâs.",
            anlam: "De ki: İnsanların kalplerine vesvese sokan, sinsice kaçıp gizlenen vesvesecinin şerrinden; cinlerden ve insanlardan olan vesvesecinin şerrinden insanların Rabbine, insanların Hükümdarına, insanların İlahına sığınırım."
        }
    ]
};

let aktifDuaKategorisi = 'dualari';

function duaKategoriDegistir(katKey, btn) {
    document.querySelectorAll('#page-dualar .vakit-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    aktifDuaKategorisi = katKey;
    duaFiltrele();
}

function duavariYukle(liste) {
    const container = document.getElementById('vakit-dualar-listesi');
    container.innerHTML = '';

    if (!liste.length) {
        container.innerHTML = '<div class="empty-state">Sonuç bulunamadı.</div>';
        return;
    }

    liste.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div style="font-weight:bold; color:var(--accent-color); font-size:1.05rem;">${item.baslik}</div>
            <div class="arabic-text">${item.arapca}</div>
            <div class="transcription">${item.okunus}</div>
            <div class="meaning"><strong>Anlamı:</strong> ${item.anlam}</div>
        `;
        container.appendChild(div);
    });
}

function duaFiltrele() {
    const txt = norm(document.getElementById('dua-arama').value.trim());
    const liste = tumDualarVeSureler[aktifDuaKategorisi];
    const filt = !txt ? liste : liste.filter(d =>
        norm(d.baslik).includes(txt) ||
        norm(d.okunus).includes(txt) ||
        norm(d.anlam).includes(txt)
    );
    duavariYukle(filt);
}

// =====================================================
// 4. ESMAÜL HÜSNA (99 İSİM TAM LİSTE)
// =====================================================
const esmaVeritabani = [
    { no: 1, isim: "Allah", arapca: "الله", anlam: "Eşi benzeri olmayan, tek ilah." },
    { no: 2, isim: "Er-Rahmân", arapca: "الرَّحْمَنُ", anlam: "Bütün mahlukata merhamet eden." },
    { no: 3, isim: "Er-Rahîm", arapca: "الرَّحِيمُ", anlam: "Ahirette müminlere merhamet eden." },
    { no: 4, isim: "El-Melik", arapca: "الْمَلِكُ", anlam: "Mülkün ve evrenin tek sahibi." },
    { no: 5, isim: "El-Kuddûs", arapca: "الْقُدُّوسُ", anlam: "Her türlü eksiklikten münezzeh." },
    { no: 6, isim: "Es-Selâm", arapca: "السَّلاَمُ", anlam: "Esenlik veren, tehlikelerden selamete çıkaran." },
    { no: 7, isim: "El-Mü'min", arapca: "الْمُؤْمِنُ", anlam: "Gönüllerde iman ışığı uyandıran, emniyet veren." },
    { no: 8, isim: "El-Müheymin", arapca: "الْمُهَيْمِنُ", anlam: "Gözeten, koruyan ve hükmü altında tutan." },
    { no: 9, isim: "El-Azîz", arapca: "الْعَزِيزُ", anlam: "İzzet sahibi, her şeye galip gelen." },
    { no: 10, isim: "El-Cebbâr", arapca: "الْجَبَّارُ", anlam: "Azamet ve kudret sahibi, dilediğini yapan." },
    { no: 11, isim: "El-Mütekebbir", arapca: "الْمُتَكَبِّرُ", anlam: "Büyüklükte eşi benzeri olmayan." },
    { no: 12, isim: "El-Hâlik", arapca: "الْخَالِقُ", anlam: "Yaratan, yoktan var eden." },
    { no: 13, isim: "El-Bâri", arapca: "الْبَارِئُ", anlam: "Her şeyi kusursuz ve bir örnek olmadan yaratan." },
    { no: 14, isim: "El-Musavvir", arapca: "الْمُصَوِّرُ", anlam: "Varlıklara şekil ve suret veren." },
    { no: 15, isim: "El-Gaffâr", arapca: "الْغَفَّارُ", anlam: "Günahları örten ve çokça bağışlayan." },
    { no: 16, isim: "El-Kahhâr", arapca: "الْقَهَّارُ", anlam: "Her şeye galip gelen, mutlak hâkim." },
    { no: 17, isim: "El-Vehhâb", arapca: "الْوَهَّابُ", anlam: "Karşılıksız bolca ihsan eden." },
    { no: 18, isim: "Er-Razzâk", arapca: "الرَّزَّاقُ", anlam: "Bütün canlıların rızkını veren." },
    { no: 19, isim: "El-Fettâh", arapca: "الْفَتَّاحُ", anlam: "Her türlü müşkülü çözen, kapıları açan." },
    { no: 20, isim: "El-Alîm", arapca: "الْعَلِيمُ", anlam: "Her şeyi en ince ayrıntısıyla bilen." },
    { no: 21, isim: "El-Kâbid", arapca: "الْقَابِضُ", anlam: "Dilediğine daraltan, ruhları kabzeden." },
    { no: 22, isim: "El-Bâsit", arapca: "الْبَاسِطُ", anlam: "Dilediğine rızkı genişleten, ferahlık veren." },
    { no: 23, isim: "El-Hâfid", arapca: "الْخَافِضُ", anlam: "Dereceleri alçaltan, kafirleri zelil eden." },
    { no: 24, isim: "Er-Râfi", arapca: "الرَّافِعُ", anlam: "Şeref verip yükselten." },
    { no: 25, isim: "El-Mu'izz", arapca: "الْمُعِزُّ", anlam: "İzzet veren, aziz kılan." },
    { no: 26, isim: "El-Müzill", arapca: "الْمُذِلُّ", anlam: "Zelil eden, hor ve hakir kılan." },
    { no: 27, isim: "Es-Semî", arapca: "السَّمِيعُ", anlam: "Her şeyi en iyi işiten." },
    { no: 28, isim: "El-Basîr", arapca: "الْبَصِيرُ", anlam: "Gizli açık her şeyi gören." },
    { no: 29, isim: "El-Hakem", arapca: "الْحَكَمُ", anlam: "Mutlak hakem, hakkı batıldan ayıran." },
    { no: 30, isim: "El-Adl", arapca: "الْعَدْلُ", anlam: "Mutlak adalet sahibi." },
    { no: 31, isim: "El-Latîf", arapca: "اللَّطِيفُ", anlam: "Lütuf sahibi, en ince işleri bilen." },
    { no: 32, isim: "El-Habîr", arapca: "الْخَبِيرُ", anlam: "Her şeyden haberdar olan." },
    { no: 33, isim: "El-Halîm", arapca: "الْحَلِيمُ", anlam: "Cezada acele etmeyen, yumuşaklık sahibi." },
    { no: 34, isim: "El-Azîm", arapca: "الْعَظِيمُ", anlam: "Büyüklük ve azamet sahibi." },
    { no: 35, isim: "El-Gafûr", arapca: "الْغَفُورُ", anlam: "Mağfireti ve affı bol olan." },
    { no: 36, isim: "Eş-Şekûr", arapca: "الشَّكُورُ", anlam: "Az amele çok mükafat veren." },
    { no: 37, isim: "El-Aliyy", arapca: "الْعَلِيُّ", anlam: "Yücelik sahibi, çok yüce." },
    { no: 38, isim: "El-Kebîr", arapca: "الْكَبِيرُ", anlam: "Pek büyük, eşsiz büyüklükte." },
    { no: 39, isim: "El-Hafîz", arapca: "الْحَفِيظُ", anlam: "Her şeyi koruyup gözeten." },
    { no: 40, isim: "El-Mukît", arapca: "الْمُقِيتُ", anlam: "Rızıkları oluşturan ve gıdalandıran." },
    { no: 41, isim: "El-Hasîb", arapca: "الْحَسِيبُ", anlam: "Herkesin hesabını en iyi gören." },
    { no: 42, isim: "El-Celîl", arapca: "الْجَلِيلُ", anlam: "Celalet ve azamet sahibi." },
    { no: 43, isim: "El-Kerîm", arapca: "الْكَرِيمُ", anlam: "Cömert, ikramı bol olan." },
    { no: 44, isim: "Er-Rakîb", arapca: "الرَّقِيبُ", anlam: "Her an gözetleyen, kontrol eden." },
    { no: 45, isim: "El-Mucîb", arapca: "الْمُجِيبُ", anlam: "Duaları kabul eden." },
    { no: 46, isim: "El-Vâsi", arapca: "الْوَاسِعُ", anlam: "İlmi ve rahmeti geniş olan." },
    { no: 47, isim: "El-Hakîm", arapca: "الْحَكِيمُ", anlam: "Her işi hikmetli olan." },
    { no: 48, isim: "El-Vedûd", arapca: "الْوَدُودُ", anlam: "Kullarını çok seven ve sevilen." },
    { no: 49, isim: "El-Mecîd", arapca: "الْمَجِيدُ", anlam: "Şanı yüksek, övgüye layık." },
    { no: 50, isim: "El-Bâis", arapca: "الْبَاعِثُ", anlam: "Ölüleri dirilten, peygamber gönderen." },
    { no: 51, isim: "Eş-Şehîd", arapca: "الشَّهِيدُ", anlam: "Her zamana ve mekana şahit olan." },
    { no: 52, isim: "El-Hakk", arapca: "الْحَقُّ", anlam: "Varlığı hiç değişmeyen, hakiki varlık." },
    { no: 53, isim: "El-Vekîl", arapca: "الْوَكِيلُ", anlam: "İşleri kendisine bırakılanlara yardım eden." },
    { no: 54, isim: "El-Kaviyy", arapca: "الْقَوِيُّ", anlam: "Pek güçlü, kudretli." },
    { no: 55, isim: "El-Metîn", arapca: "الْمَتِينُ", anlam: "Son derece sağlam, sarsılmaz." },
    { no: 56, isim: "El-Veliyy", arapca: "الْوَلِيُّ", anlam: "Müminlerin dostu ve yardımcısı." },
    { no: 57, isim: "El-Hamîd", arapca: "الْحَمِيدُ", anlam: "Her türlü övgüye layık olan." },
    { no: 58, isim: "El-Muhsî", arapca: "الْمُحْصِي", anlam: "Her şeyin sayısını bir bir bilen." },
    { no: 59, isim: "El-Mubdi", arapca: "الْمُبْدِئُ", anlam: "Maddesiz ve örneksiz olarak yaratan." },
    { no: 60, isim: "El-Muîd", arapca: "الْمُعِيدُ", anlam: "Yaratılmışları yok edip tekrar dirilten." },
    { no: 61, isim: "El-Muhyî", arapca: "الْمُحْيِي", anlam: "Can veren, hayat bahşeden." },
    { no: 62, isim: "El-Mumît", arapca: "الْمُمِيتُ", anlam: "Eceli gelince canlıları öldüren." },
    { no: 63, isim: "El-Hayy", arapca: "الْحَيُّ", anlam: "Daima diri, ezeli ve ebedi hayat sahibi." },
    { no: 64, isim: "El-Kayyûm", arapca: "الْقَيُّومُ", anlam: "Gökleri ve yeri ayakta tutan." },
    { no: 65, isim: "El-Vâcid", arapca: "الْوَاجِدُ", anlam: "İstediğini istediği an bulan." },
    { no: 66, isim: "El-Mâcid", arapca: "الْمَاجِدُ", anlam: "Şanı ve keremi çok yüce olan." },
    { no: 67, isim: "El-Vâhid", arapca: "الْوَاحِدُ", anlam: "Zatında ve sıfatlarında tek olan." },
    { no: 68, isim: "Es-Samed", arapca: "الصَّمَدُ", anlam: "Her şeyin kendisine muhtaç olduğu." },
    { no: 69, isim: "El-Kâdir", arapca: "الْقَادِرُ", anlam: "İstediğini yapmaya gücü yeten." },
    { no: 70, isim: "El-Muktedir", arapca: "الْمُقْتَدِرُ", anlam: "Kudret sahibi, dilediği gibi tasarruf eden." },
    { no: 71, isim: "El-Mukaddim", arapca: "الْمُقَدِّمُ", anlam: "Dilediğini öne alan, öne geçiren." },
    { no: 72, isim: "El-Muahhir", arapca: "الْمُؤَخِّرُ", anlam: "Dilediğini geriye bırakan." },
    { no: 73, isim: "El-Evvel", arapca: "الأَوَّلُ", anlam: "Başlangıcı olmayan ezeli varlık." },
    { no: 74, isim: "El-Âhir", arapca: "الأَخِرُ", anlam: "Sonu olmayan ebedi varlık." },
    { no: 75, isim: "Ez-Zâhir", arapca: "الظَّاهِرُ", anlam: "Varlığı aşikar olan." },
    { no: 76, isim: "El-Bâtın", arapca: "الْبَاطِنُ", anlam: "Gözlerden gizli olan, iç yüzü bilen." },
    { no: 77, isim: "El-Vâlî", arapca: "الْوَالِي", anlam: "Bütün kainatı idare eden." },
    { no: 78, isim: "El-Müteâlî", arapca: "الْمُتَعَالِي", anlam: "Yücelikte en üstün olan." },
    { no: 79, isim: "El-Berr", arapca: "الْبَرُّ", anlam: "İyilik ve ihsanı bol olan." },
    { no: 80, isim: "Et-Tevvâb", arapca: "التَّوَّابُ", anlam: "Tövbeleri kabul eden." },
    { no: 81, isim: "El-Müntekim", arapca: "الْمُنْتَقِمُ", anlam: "Zalimleri cezalandıran." },
    { no: 82, isim: "El-Afüvv", arapca: "الْعَفُوُّ", anlam: "Çok affeden, günahları silen." },
    { no: 83, isim: "Er-Ra'ûf", arapca: "الرَّؤُوفُ", anlam: "Pek merhametli, şefkatli." },
    { no: 84, isim: "Mâlik-ül Mülk", arapca: "مَالِكُ الْمُلْكِ", anlam: "Mülkün ebedi tek sahibi." },
    { no: 85, isim: "Zül-Celâli vel İkrâm", arapca: "ذُو الْجَلاَلِ وَالإِكْرَامِ", anlam: "Celal, azamet ve ikram sahibi." },
    { no: 86, isim: "El-Muksit", arapca: "الْمُقْسِطُ", anlam: "Bütün işlerini denk ve adaletli yapan." },
    { no: 87, isim: "El-Câmi", arapca: "الْجَامِعُ", anlam: "Mahşerde mahlukatı toplayan." },
    { no: 88, isim: "El-Ganiyy", arapca: "الْغَنِيُّ", anlam: "Hiçbir şeye muhtaç olmayan zengin." },
    { no: 89, isim: "El-Mugnî", arapca: "الْمُغْنِي", anlam: "Müstağni kılan, zenginleştiren." },
    { no: 90, isim: "El-Mâni", arapca: "الْمَانِعُ", anlam: "Dilediği şeye engel olan." },
    { no: 91, isim: "Ed-Dârr", arapca: "الضَّارُّ", anlam: "Elem ve zarar veren şeyleri yaratan." },
    { no: 92, isim: "En-Nâfi", arapca: "النَّافِعُ", anlam: "Faydalı şeyleri yaratan." },
    { no: 93, isim: "En-Nûr", arapca: "النُّورُ", anlam: "Alemleri aydınlatan nur." },
    { no: 94, isim: "El-Hâdî", arapca: "الْهَادِي", anlam: "Hidayet veren, doğru yola ileten." },
    { no: 95, isim: "El-Bedî", arapca: "الْبَدِيعُ", anlam: "Örneksiz ve eşsiz harikalar yaratan." },
    { no: 96, isim: "El-Bâkî", arapca: "الْبَاقِي", anlam: "Varlığının sonu olmayan." },
    { no: 97, isim: "El-Vâris", arapca: "الْوَارِثُ", anlam: "Her şeyin asıl sahibi ve varisi." },
    { no: 98, isim: "Er-Raşîd", arapca: "الرَّشِيدُ", anlam: "Doğru yolu gösteren, dosdoğru idare eden." },
    { no: 99, isim: "Es-Sabûr", arapca: "الصَّبُورُ", anlam: "Çok sabırlı, cezalandırmada acele etmeyen." }
];

function esmalariYukle(liste) {
    const container = document.getElementById('esma-listesi');
    container.innerHTML = '';
    if (!liste.length) {
        container.innerHTML = '<div class="empty-state">Sonuç bulunamadı.</div>';
        return;
    }
    liste.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:var(--gold);">${item.no}. ${item.isim}</span>
                <span class="arabic-text" style="margin:0;">${item.arapca}</span>
            </div>
            <div class="meaning" style="margin-top:4px;">${item.anlam}</div>
        `;
        container.appendChild(div);
    });
}

function esmaFiltrele() {
    const txt = norm(document.getElementById('esma-arama').value.trim());
    const filt = !txt ? esmaVeritabani : esmaVeritabani.filter(e =>
        e.no.toString().includes(txt) ||
        norm(e.isim).includes(txt) || 
        norm(e.anlam).includes(txt)
    );
    esmalariYukle(filt);
}

// =====================================================
// 5. NAMAZ VAKİTLERİ (DİYANET YÖNTEMİ / ALADHAN API)
// =====================================================
const VAKIT_SIRA = [
    { key: 'imsak',  ad: 'İmsak',  api: 'Fajr' },
    { key: 'gunes',  ad: 'Güneş',  api: 'Sunrise' },
    { key: 'ogle',   ad: 'Öğle',   api: 'Dhuhr' },
    { key: 'ikindi', ad: 'İkindi', api: 'Asr' },
    { key: 'aksam',  ad: 'Akşam',  api: 'Maghrib' },
    { key: 'yatsi',  ad: 'Yatsı',  api: 'Isha' }
];

let vakitler = null;       // { imsak:'HH:MM', ... }
let vakitIstekNo = 0;      // eski isteklerin sonucunu yok saymak için

function vakitDurumYaz(metin) {
    document.getElementById('vakit-durum').innerHTML = metin || '';
}

function vakitleriEkranaYaz(v) {
    VAKIT_SIRA.forEach(x => {
        document.getElementById('v-' + x.key).innerText = v ? v[x.key] : '--:--';
    });
}

function eskiVakitCachetemizle() {
    try {
        const bugun = bugunIso();
        const silinecek = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf('vakit:') === 0 && k !== 'vakit:son' && k.indexOf(bugun) === -1) silinecek.push(k);
        }
        silinecek.forEach(k => localStorage.removeItem(k));
    } catch (e) { /* yoksay */ }
}

async function vakitleriYukle(url, cacheKey, etiket) {
    const istekNo = ++vakitIstekNo;
    vakitDurumYaz('Yükleniyor...');
    document.getElementById('sonraki-vakit').innerText = 'Vakitler yükleniyor...';

    let veri = lsJSON(cacheKey);
    let guncel = !!veri;

    if (!veri) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const j = await res.json();
            if (j && j.data && j.data.timings) {
                const t = j.data.timings;
                veri = {};
                VAKIT_SIRA.forEach(x => { veri[x.key] = String(t[x.api]).slice(0, 5); });
                guncel = true;
                lsSet(cacheKey, JSON.stringify(veri));
                lsSet('vakit:son', JSON.stringify({ v: veri, e: etiket }));
            }
        } catch (err) {
            console.error('Vakitler çekilirken hata oluştu:', err);
        }
    }

    if (istekNo !== vakitIstekNo) return; // daha yeni bir istek başladı

    if (!veri) {
        const son = lsJSON('vakit:son');
        if (son && son.v) {
            veri = son.v;
            etiket = son.e + ' (son kaydedilen)';
        }
    }

    if (!veri) {
        vakitler = null;
        vakitleriEkranaYaz(null);
        document.querySelectorAll('.vakit-cell').forEach(c => c.classList.remove('aktif'));
        document.getElementById('sonraki-vakit').innerText = 'Vakitler alınamadı';
        vakitDurumYaz('İnternet bağlantınızı kontrol edin. <a href="#" style="color:var(--gold)" onclick="vakitleriGuncelle(); return false;">Tekrar dene</a>');
        return;
    }

    vakitler = veri;
    vakitleriEkranaYaz(veri);
    vakitDurumYaz((guncel ? '📍 ' : '⚠️ ') + etiket + (guncel ? '' : ' - bağlantı yok, kayıtlı vakitler gösteriliyor'));
    sonrakiVakitGuncelle();
}

function vakitleriGuncelle() {
    const sel = document.getElementById('sehir-secim');
    const sehir = sel.value;
    const ad = sel.options[sel.selectedIndex].text;
    lsSet('sehir', sehir);
    lsSet('vakitModu', 'sehir');
    vakitleriYukle(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(sehir)}&country=Turkey&method=13`,
        'vakit:sehir:' + sehir + ':' + bugunIso(),
        ad
    );
}

function vakitleriKonumdanGetir() {
    if (!navigator.geolocation) {
        vakitDurumYaz('Cihazınız konum özelliğini desteklemiyor.');
        return;
    }
    vakitDurumYaz('Konum alınıyor...');
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude.toFixed(3);
        const lng = pos.coords.longitude.toFixed(3);
        lsSet('vakitModu', 'gps');
        vakitleriYukle(
            `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=13`,
            'vakit:gps:' + lat + ',' + lng + ':' + bugunIso(),
            'Konumunuz'
        );
    }, () => {
        vakitDurumYaz('Konum izni verilmedi. Şehir listesinden seçebilirsiniz.');
    }, { timeout: 10000, maximumAge: 600000 });
}

function sonrakiVakitGuncelle() {
    if (!vakitler) return;
    const simdi = new Date();
    let hedef = null;
    let idx = -1;

    for (let i = 0; i < VAKIT_SIRA.length; i++) {
        const p = vakitler[VAKIT_SIRA[i].key].split(':');
        const dt = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), parseInt(p[0], 10), parseInt(p[1], 10), 0);
        if (dt > simdi) { hedef = dt; idx = i; break; }
    }
    if (!hedef) { // Yatsı geçti: ertesi gün imsağı (yaklaşık)
        const p = vakitler.imsak.split(':');
        hedef = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + 1, parseInt(p[0], 10), parseInt(p[1], 10), 0);
        idx = 0;
    }

    const fark = Math.max(0, Math.floor((hedef - simdi) / 1000));
    const sa = Math.floor(fark / 3600);
    const dk = Math.floor((fark % 3600) / 60);
    const sn = fark % 60;
    const kalan = (sa > 0 ? sa + ' sa ' : '') + pad2(dk) + ' dk ' + pad2(sn) + ' sn';

    document.querySelectorAll('.vakit-cell').forEach(c => c.classList.remove('aktif'));
    const hucre = document.getElementById('c-' + VAKIT_SIRA[idx].key);
    if (hucre) hucre.classList.add('aktif');
    document.getElementById('sonraki-vakit').innerHTML =
        'Sonraki vakit: <b>' + VAKIT_SIRA[idx].ad + '</b> (' + vakitler[VAKIT_SIRA[idx].key] + ') · ' + kalan;
}

// =====================================================
// 6. KUR'AN DİNLETİSİ
// =====================================================
const hafizVerileri = {
    alafasy: { server: "https://server8.mp3quran.net/afs/", name: "Mishary Alafasy" },
    abdulbasit: { server: "https://server7.mp3quran.net/basit/", name: "Abdulbasit Abdussamed" },
    almuaiqly: { server: "https://server12.mp3quran.net/maher/", name: "Maher Al-Muaiqly" },
    dosari: { server: "https://server11.mp3quran.net/dosmr/", name: "Yasser Al-Dosari" },
    shuraim: { server: "https://server7.mp3quran.net/shur/", name: "Saud Al-Shuraim" }
};

const surelerAyetler = [
    { no: "036", ad: "1. Yasin Suresi" },
    { no: "067", ad: "2. Mülk Suresi (Tebareke)" },
    { no: "078", ad: "3. Nebe Suresi (Amme)" },
    { no: "055", ad: "4. Rahman Suresi" },
    { no: "001", ad: "5. Fatiha Suresi" },
    { no: "002", ad: "6. Bakara Suresi (Ayetel Kursi Dahil)" },
    { no: "059", ad: "7. Haşr Suresi (Hüvallahüllezi)" },
    { no: "062", ad: "8. Cuma Suresi" },
    { no: "048", ad: "9. Fetih Suresi" },
    { no: "056", ad: "10. Vakıa Suresi" },
    { no: "112", ad: "11. İhlas Suresi" },
    { no: "113", ad: "12. Felak Suresi" },
    { no: "114", ad: "13. Nas Suresi" },
    { no: "108", ad: "14. Kevser Suresi" },
    { no: "094", ad: "15. İnşirah Suresi", mp3No: "094" },
    { no: "033", ad: "16. Ahzab Suresi (35. Ayet)", mp3No: "033" },
    { no: "097", ad: "17. Kadir Suresi" },
    { no: "105", ad: "18. Fil Suresi" },
    { no: "106", ad: "19. Kureyş Suresi" },
    { no: "107", ad: "20. Maun Suresi" },
    { no: "109", ad: "21. Kafirun Suresi" },
    { no: "110", ad: "22. Nasr Suresi" },
    { no: "111", ad: "23. Tebbet Suresi" }
];

function kuranListesiniGuncelle() {
    const secilenHafizKey = document.getElementById('hafiz-secim').value;
    const hafiz = hafizVerileri[secilenHafizKey];
    const listeContainer = document.getElementById('kuran-ses-listesi');
    listeContainer.innerHTML = '';

    surelerAyetler.forEach(sure => {
        const dosyaNo = sure.mp3No || sure.no;
        const url = `${hafiz.server}${dosyaNo}.mp3`;
        const div = document.createElement('div');
        div.className = 'kuran-item';
        div.innerHTML = `
            <div class="kuran-title">${sure.ad} - <small style="color:#aaa">${hafiz.name}</small></div>
            <audio controls class="kuran-audio" preload="none">
                <source src="${url}" type="audio/mpeg">
                Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
            <div class="audio-hata">Ses dosyası yüklenemedi. Bağlantınızı kontrol edin veya başka bir hafız seçin.</div>
        `;
        listeContainer.appendChild(div);
    });
}

// Aynı anda yalnızca bir ses çalsın + hata mesajı
(function kuranSesYonetimi() {
    const kap = document.getElementById('kuran-ses-listesi');
    kap.addEventListener('play', function (e) {
        kap.querySelectorAll('audio').forEach(a => { if (a !== e.target) a.pause(); });
        if (typeof ayetSesiDurdur === 'function') ayetSesiDurdur();
        const hata = e.target.parentNode.querySelector('.audio-hata');
        if (hata) hata.style.display = 'none';
    }, true);
    kap.addEventListener('error', function (e) {
        if (e.target && e.target.tagName === 'SOURCE') {
            const hata = e.target.parentNode.parentNode.querySelector('.audio-hata');
            if (hata) hata.style.display = 'block';
        }
    }, true);
})();

// =====================================================
// 7. HİCRİ TAKVİM, RESMİ VE DİNİ GÜNLER (HER YILA UYGUN)
// =====================================================

// Diyanet takvimiyle fark görürseniz buradan tüm hesabı ±1 gün kaydırabilirsiniz (örn. 1 veya -1)
const HICRI_GUN_KAYDIRMA = 0;

// Belirli bir yılın tarihlerini elle düzeltmek isterseniz (YYYY-MM-DD).
// Örnek: { "2027": { "Ramazan Bayramı": "2027-03-09" } }
const MANUEL_TARIH_DUZELTME = {};

// Tercihen Intl (Umm al-Qura); desteklenmezse tablolu hesap kullanılır
let hicriFormatci = null;
try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
        day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC'
    });
    if (/islamic/.test(f.resolvedOptions().calendar)) hicriFormatci = f;
} catch (e) { hicriFormatci = null; }

// Tablolu (Kuveyt algoritması) yedek hesap
function hicriTablolu(dt) {
    const jdn = Math.floor(dt.getTime() / 86400000) + 2440588;
    let l = jdn - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    const j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const m = Math.floor((24 * l) / 709);
    const d = l - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return { y: y, m: m, d: d };
}

// dt: UTC 12:00'a ayarlı Date
function hicriHesapla(dt) {
    const kayik = new Date(dt.getTime() + HICRI_GUN_KAYDIRMA * 86400000);
    if (hicriFormatci) {
        let y, m, d;
        hicriFormatci.formatToParts(kayik).forEach(p => {
            if (p.type === 'year') y = parseInt(p.value, 10);
            if (p.type === 'month') m = parseInt(p.value, 10);
            if (p.type === 'day') d = parseInt(p.value, 10);
        });
        if (y && m && d) return { y: y, m: m, d: d };
    }
    return hicriTablolu(kayik);
}

function utcOgle(y, m, d) { return new Date(Date.UTC(y, m, d, 12, 0, 0)); }
function gunEkle(dt, n) { return new Date(dt.getTime() + n * 86400000); }
function isoDt(dt) { return dt.toISOString().slice(0, 10); }

// Hicri (ay-gün) kuralları: her yıl otomatik bulunur
const DINI_KURALLAR = {
    '1-1':   { ad: 'Hicri Yılbaşı',           tur: 'dini',   gun: 1 },
    '1-10':  { ad: 'Aşure Günü',              tur: 'dini',   gun: 1 },
    '3-11':  { ad: 'Mevlid Kandili',          tur: 'kandil', gun: 1 },
    '7-26':  { ad: 'Miraç Kandili',           tur: 'kandil', gun: 1 },
    '8-14':  { ad: 'Berat Kandili',           tur: 'kandil', gun: 1 },
    '9-1':   { ad: 'Ramazan Ayı Başlangıcı',  tur: 'dini',   gun: 1 },
    '9-26':  { ad: 'Kadir Gecesi',            tur: 'kandil', gun: 1 },
    '10-1':  { ad: 'Ramazan Bayramı',         tur: 'dini',   gun: 3, arefe: 'Ramazan Bayramı Arefesi' },
    '12-10': { ad: 'Kurban Bayramı',          tur: 'dini',   gun: 4, arefe: 'Kurban Bayramı Arefesi' }
};

// Sabit tarihli resmi bayram ve tatiller
const RESMI_GUNLER = [
    { ad: 'Yılbaşı', ay: 1, gun: 1 },
    { ad: 'Ulusal Egemenlik ve Çocuk Bayramı', ay: 4, gun: 23 },
    { ad: 'Emek ve Dayanışma Günü', ay: 5, gun: 1 },
    { ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", ay: 5, gun: 19 },
    { ad: 'Demokrasi ve Milli Birlik Günü', ay: 7, gun: 15 },
    { ad: 'Zafer Bayramı', ay: 8, gun: 30 },
    { ad: 'Cumhuriyet Bayramı Arifesi (yarım gün)', ay: 10, gun: 28 },
    { ad: 'Cumhuriyet Bayramı', ay: 10, gun: 29 }
];

const olayCache = {};

function yilEtkinlikleri(yil) {
    if (olayCache[yil]) return olayCache[yil];
    const liste = [];

    // Resmi günler
    RESMI_GUNLER.forEach(r => {
        const iso = yil + '-' + pad2(r.ay) + '-' + pad2(r.gun);
        liste.push({ ad: r.ad, bas: iso, bit: iso, tur: 'resmi' });
    });

    // Dini günler: yılın her gününü hicri takvime çevirip kuralları ara
    const ilk = utcOgle(yil, 0, 1);
    for (let i = 0; i < 366; i++) {
        const dt = gunEkle(ilk, i);
        if (dt.getUTCFullYear() !== yil) break;
        const h = hicriHesapla(dt);
        const kural = DINI_KURALLAR[h.m + '-' + h.d];

        if (kural) {
            const bas = isoDt(dt);
            const bit = isoDt(gunEkle(dt, kural.gun - 1));
            liste.push({ ad: kural.ad, bas: bas, bit: bit, tur: kural.tur });
            if (kural.arefe) {
                const ar = isoDt(gunEkle(dt, -1));
                liste.push({ ad: kural.arefe + ' (yarım gün)', bas: ar, bit: ar, tur: 'dini' });
            }
        }

        // Regaib Kandili: Recep ayının ilk Cuma gecesi (perşembe akşamı)
        if (h.m === 7 && h.d <= 7 && dt.getUTCDay() === 5) {
            const per = gunEkle(dt, -1);
            if (per.getUTCFullYear() === yil) {
                const iso = isoDt(per);
                liste.push({ ad: 'Regaib Kandili', bas: iso, bit: iso, tur: 'kandil' });
            }
        }
    }

    // Elle düzeltmeler
    const duz = MANUEL_TARIH_DUZELTME[yil];
    if (duz) {
        liste.forEach(o => {
            const anahtar = o.ad.replace(/ \(yarım gün\)$/, '');
            if (duz[o.ad] || duz[anahtar]) {
                const sureGun = Math.round((yerelGunBasi(o.bit) - yerelGunBasi(o.bas)) / 86400000);
                o.bas = duz[o.ad] || duz[anahtar];
                o.bit = isoDt(gunEkle(new Date(o.bas + 'T12:00:00Z'), sureGun));
            }
        });
    }

    liste.sort((a, b) => a.bas < b.bas ? -1 : (a.bas > b.bas ? 1 : 0));
    olayCache[yil] = liste;
    return liste;
}

function hicriTarihMetni(dt) {
    const h = hicriHesapla(dt);
    return h.d + ' ' + HICRI_AYLAR[h.m - 1] + ' ' + h.y;
}

function bugunBilgisiYaz() {
    const now = new Date();
    const dt = utcOgle(now.getFullYear(), now.getMonth(), now.getDate());
    const el = document.getElementById('header-tarih');
    if (el) {
        el.innerText = now.getDate() + ' ' + AYLAR[now.getMonth()] + ' ' + now.getFullYear() + ' ' + GUNLER[now.getDay()] + ' • ' + hicriTarihMetni(dt);
    }
}

function turMetni(tur) {
    if (tur === 'resmi') return '🇹🇷 Resmi Bayram / Tatil';
    if (tur === 'kandil') return '🕯️ Kandil Gecesi';
    return '🌙 Dini Gün / Bayram';
}

function bayramBannerGuncelle() {
    const bugun = bugunIso();
    const yil = new Date().getFullYear();
    const bugunku = yilEtkinlikleri(yil).concat(yilEtkinlikleri(yil - 1)).filter(o => o.bas <= bugun && bugun <= o.bit);
    if (!bugunku.length) return;

    const o = bugunku[0];
    const banner = document.getElementById('today-banner');
    let mesaj;
    if (o.tur === 'resmi') mesaj = 'Resmi bayramınız kutlu olsun!';
    else if (o.tur === 'kandil') mesaj = 'Bu akşam kandil gecesi. Kandiliniz mübarek olsun.';
    else if (o.ad.indexOf('Arefe') !== -1) mesaj = 'Arefe günü. Yarın bayram, mübarek olsun.';
    else if (o.ad.indexOf('Bayram') !== -1) mesaj = 'Bayramınız mübarek olsun.';
    else mesaj = 'Mübarek gününüz kutlu olsun.';

    document.getElementById('today-title').innerText = '🎉 Bugün ' + o.ad + '!';
    document.getElementById('today-desc').innerText = mesaj;
    banner.style.display = 'block';
}

function siradakiEtkinlik() {
    const bugun = bugunIso();
    const yil = new Date().getFullYear();
    const tum = yilEtkinlikleri(yil).concat(yilEtkinlikleri(yil + 1));
    return tum.find(o => o.bit >= bugun) || null;
}

function geriSayimCiz() {
    const container = document.getElementById('siradaki-bayram-container');
    if (!container) return;
    const o = siradakiEtkinlik();
    if (!o) return;

    const simdi = new Date();
    const hedef = yerelGunBasi(o.bas);
    const bugun = bugunIso();
    const devamEdiyor = o.bas <= bugun && bugun <= o.bit;

    let sayacHtml;
    if (devamEdiyor) {
        sayacHtml = '<div style="font-size:1.6rem; font-weight:bold; color:var(--accent-color); margin-top:16px;">' +
            (o.tur === 'kandil' ? '🌙 Bu akşam!' : '🎉 Bugün / Devam ediyor') + '</div>';
    } else {
        const fark = Math.max(0, hedef - simdi);
        const g = Math.floor(fark / 86400000);
        const s = Math.floor((fark % 86400000) / 3600000);
        const d = Math.floor((fark % 3600000) / 60000);
        const sn = Math.floor((fark % 60000) / 1000);
        sayacHtml = '<div class="countdown">' +
            '<div class="cd-box"><b>' + g + '</b><span>Gün</span></div>' +
            '<div class="cd-box"><b>' + pad2(s) + '</b><span>Saat</span></div>' +
            '<div class="cd-box"><b>' + pad2(d) + '</b><span>Dakika</span></div>' +
            '<div class="cd-box"><b>' + pad2(sn) + '</b><span>Saniye</span></div>' +
            '</div>';
    }

    let tarihMetni = tarihYaz(o.bas);
    if (o.bit !== o.bas) tarihMetni += ' - ' + tarihYaz(o.bit, false);
    if (o.tur === 'kandil') tarihMetni += ' (akşam)';

    container.innerHTML =
        '<div class="bayram-hero">' +
        '<span class="tur-rozet">' + turMetni(o.tur) + '</span>' +
        '<h2>' + o.ad + '</h2>' +
        '<div style="font-size:0.85rem; color:#bbb; margin-top:6px;">' + tarihMetni + '</div>' +
        sayacHtml +
        '</div>';
}

let bayramYili = new Date().getFullYear();
let bayramFiltre = 'hepsi';

function bayramListesiCiz() {
    document.getElementById('bayram-yil').innerText = bayramYili;
    const bugun = bugunIso();
    const liste = yilEtkinlikleri(bayramYili).filter(o => bayramFiltre === 'hepsi' || o.tur === bayramFiltre);
    const kap = document.getElementById('bayram-listesi');

    if (!liste.length) {
        kap.innerHTML = '<div class="empty-state">Kayıt yok.</div>';
        return;
    }

    kap.innerHTML = liste.map(o => {
        let sinif = 'olay-satir';
        if (o.bit < bugun) sinif += ' gecmis';
        else if (o.bas <= bugun && bugun <= o.bit) sinif += ' bugun';

        let t = tarihYaz(o.bas);
        if (o.bit !== o.bas) t = tarihYaz(o.bas, false).replace(' ' + bayramYili, '') + ' - ' + tarihYaz(o.bit);
        if (o.tur === 'kandil') t += ' (akşam)';

        const rozetSinif = 'rozet-' + o.tur;
        const rozetMetin = o.tur === 'resmi' ? 'Resmi' : (o.tur === 'kandil' ? 'Kandil' : 'Dini');

        return '<div class="' + sinif + '">' +
            '<div><div class="olay-ad">' + o.ad + '</div><div class="olay-tarih">' + t + '</div></div>' +
            '<span class="olay-rozet ' + rozetSinif + '">' + rozetMetin + '</span>' +
            '</div>';
    }).join('');
}

function bayramYiliDegistir(n) {
    bayramYili += n;
    if (bayramYili < 1990) bayramYili = 1990;
    if (bayramYili > 2100) bayramYili = 2100;
    bayramListesiCiz();
}

function bayramFiltreSec(f, btn) {
    bayramFiltre = f;
    document.querySelectorAll('#bayram-filtre .vakit-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    bayramListesiCiz();
}

function siradakiBayramiHesapla() {
    bayramBannerGuncelle();
    geriSayimCiz();
    bayramListesiCiz();
}

// =====================================================
// 8. KIBLE PUSULASI & HARİTA
// =====================================================
let map, userMarker, meccaMarker, polyline;
const meccaLat = 21.4225;
const meccaLng = 39.8262;
let hedefKibleAci = 0;
let kibleHazir = false;
let pusulaAktif = false;
let pusulaDonus = 0;      // sürekli (sarmayan) açı: ani 360° dönüşleri önler
let pusulaYonVar = false;
let pusulaIlkOlcum = true;
let kibleYonde = false;

function haritaKur() {
    if (map || typeof L === 'undefined') return;
    map = L.map('map').setView([39.9334, 32.8597], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    meccaMarker = L.marker([meccaLat, meccaLng]).addTo(map).bindPopup('Kâbe (Mekke)');
}

function kibleDurumYaz(metin, ok) {
    const el = document.getElementById('kible-durum');
    el.innerText = metin || '';
    el.classList.toggle('ok', !!ok);
}

function mesafeKm(lat, lng) {
    const R = 6371;
    const dLat = (meccaLat - lat) * Math.PI / 180;
    const dLng = (meccaLng - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat * Math.PI / 180) * Math.cos(meccaLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function konumuUygula(lat, lng, varsayilan) {
    haritaKur();
    if (map) {
        map.setView([lat, lng], 6);
        if (userMarker) map.removeLayer(userMarker);
        userMarker = L.marker([lat, lng]).addTo(map).bindPopup(varsayilan ? 'Varsayılan konum (Ankara)' : 'Konumunuz');

        if (polyline) map.removeLayer(polyline);
        polyline = L.polyline([[lat, lng], [meccaLat, meccaLng]], { color: '#dfb15b', weight: 3 }).addTo(map);
    }

    hedefKibleAci = kibleAcisiHesapla(lat, lng);
    kibleHazir = true;
    document.getElementById('kible-acisi').innerText = 'Kıble Açınız: ' + hedefKibleAci.toFixed(1) + '°';
    document.getElementById('kible-mesafe').innerText =
        'Kâbe\'ye yaklaşık uzaklık: ' + Math.round(mesafeKm(lat, lng)).toLocaleString('tr-TR') + ' km' +
        (varsayilan ? ' (konum izni verilmediği için Ankara baz alındı)' : '');
    pusulaCiz();
}

function kibleKonumAl() {
    document.getElementById('kible-acisi').innerText = 'Konum alınıyor...';
    if (!navigator.geolocation) {
        konumuUygula(39.9334, 32.8597, true);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => konumuUygula(pos.coords.latitude, pos.coords.longitude, false),
        () => konumuUygula(39.9334, 32.8597, true),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
}

function pusulaCiz() {
    const face = document.getElementById('compass-face');
    const pointer = document.getElementById('compass-pointer');
    const yon = pusulaYonVar ? pusulaDonus : 0;
    if (face) face.style.transform = 'rotate(' + (-yon) + 'deg)';
    if (pointer) pointer.style.transform = 'rotate(' + (hedefKibleAci - yon) + 'deg)';
}

function pusulaOlayi(e) {
    let yon = null;
    if (typeof e.webkitCompassHeading === 'number') {
        yon = e.webkitCompassHeading;                 // iOS: kuzeyden saat yönünde
    } else if (e.alpha !== null && e.alpha !== undefined && (e.absolute === true || e.type === 'deviceorientationabsolute')) {
        yon = (360 - e.alpha) % 360;                  // Android: alpha saat yönünün tersi
    }
    if (yon === null) return;

    if (pusulaIlkOlcum) {
        pusulaDonus = yon;
        pusulaIlkOlcum = false;
    } else {
        // En kısa yoldan, yumuşatarak dön
        let delta = ((yon - (pusulaDonus % 360)) + 540) % 360 - 180;
        pusulaDonus += delta * 0.3;
    }
    pusulaYonVar = true;
    pusulaCiz();

    if (kibleHazir) {
        const fark = Math.abs(((hedefKibleAci - (pusulaDonus % 360)) + 540) % 360 - 180);
        const yonde = fark < 4;
        if (yonde && !kibleYonde && navigator.vibrate) navigator.vibrate(60);
        kibleYonde = yonde;
        kibleDurumYaz(yonde ? '✓ Kıble yönündesiniz' : 'Telefonu çevirerek 🕋 okunu yukarı getirin', yonde);
    }
}

function pusulaDinlemeyiBaslat() {
    if (pusulaAktif) return;
    pusulaAktif = true;
    if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', pusulaOlayi, true);
    } else {
        window.addEventListener('deviceorientation', pusulaOlayi, true);
    }
    kibleDurumYaz('Pusula sensörü bekleniyor...');
    setTimeout(() => {
        if (!pusulaYonVar) {
            kibleDurumYaz('Pusula sensörü verisi alınamadı. Harita üzerindeki çizgiyi ve açı değerini kullanabilirsiniz.');
        }
    }, 3000);
}

function pusulaBaslat() {
    if (typeof DeviceOrientationEvent === 'undefined') {
        kibleDurumYaz('Cihazınız yön sensörünü desteklemiyor.');
        return;
    }
    // iOS 13+ izin ister
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(r => {
            if (r === 'granted') pusulaDinlemeyiBaslat();
            else kibleDurumYaz('Pusula izni verilmedi.');
        }).catch(() => kibleDurumYaz('Pusula izni alınamadı.'));
    } else {
        pusulaDinlemeyiBaslat();
    }
}

function kibleAcisiHesapla(lat, lng) {
    const phiK = meccaLat * Math.PI / 180;
    const lambdaK = meccaLng * Math.PI / 180;
    const phi = lat * Math.PI / 180;
    const lambda = lng * Math.PI / 180;

    const y = Math.sin(lambdaK - lambda);
    const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    return (qibla + 360) % 360;
}

function kibleSayfasiAcildi() {
    haritaKur();
    if (map) map.invalidateSize();
    if (!kibleHazir) kibleKonumAl();
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission !== 'function') {
        pusulaDinlemeyiBaslat(); // Android: izin gerekmez
    } else if (!pusulaAktif) {
        kibleDurumYaz('Pusulayı etkinleştirmek için "Pusulayı Başlat" düğmesine dokunun.');
    }
}

// =====================================================
// 8B. KUR'AN-I KERİM OKUMA MODU (SAYFA / CÜZ, ARAMA, YER İMİ, AYET SESİ)
// Veri: Al Quran Cloud (quran-uthmani + Türkçe meal). Bir kez indirilir, cihazda saklanır.
// =====================================================

const SURE_ADLARI = ["Fâtiha","Bakara","Âl-i İmrân","Nisâ","Mâide","En'âm","A'râf","Enfâl","Tevbe","Yûnus","Hûd","Yûsuf","Ra'd","İbrâhîm","Hicr","Nahl","İsrâ","Kehf","Meryem","Tâhâ","Enbiyâ","Hac","Mü'minûn","Nûr","Furkân","Şuarâ","Neml","Kasas","Ankebût","Rûm","Lokmân","Secde","Ahzâb","Sebe'","Fâtır","Yâsîn","Sâffât","Sâd","Zümer","Mü'min","Fussilet","Şûrâ","Zuhruf","Duhân","Câsiye","Ahkâf","Muhammed","Fetih","Hucurât","Kâf","Zâriyât","Tûr","Necm","Kamer","Rahmân","Vâkıa","Hadîd","Mücâdele","Haşr","Mümtehine","Saff","Cuma","Münâfikûn","Teğâbün","Talâk","Tahrîm","Mülk","Kalem","Hâkka","Meâric","Nûh","Cin","Müzzemmil","Müddessir","Kıyâme","İnsân","Mürselât","Nebe'","Nâziât","Abese","Tekvîr","İnfitâr","Mutaffifîn","İnşikak","Bürûc","Târık","A'lâ","Gâşiye","Fecr","Beled","Şems","Leyl","Duhâ","İnşirâh","Tîn","Alak","Kadir","Beyyine","Zilzâl","Âdiyât","Kâria","Tekâsür","Asr","Hümeze","Fîl","Kureyş","Mâûn","Kevser","Kâfirûn","Nasr","Tebbet","İhlâs","Felak","Nâs"];
const SURE_AYET = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const TOPLAM_AYET = 6236;

const KISAYOLLAR = [
    { ad: "Âyetü'l-Kürsî (Bakara 255)", s: 2, a: 255, k: ['ayetel kursi', 'ayet el kursi', 'ayetul kursi', 'ayetelkursi', 'kursi'] },
    { ad: "Âmene'r-Resûlü (Bakara 285)", s: 2, a: 285, k: ['amenerrasulu', 'amenerresulu', 'amene rasulu'] }
];

const KURAN_HAFIZLAR = [
    { id: 'ar.alafasy', ad: 'Mishary Alafasy' },
    { id: 'ar.abdulbasitmurattal', ad: 'Abdulbasit Abdussamed' },
    { id: 'ar.mahermuaiqly', ad: 'Maher Al-Muaiqly' },
    { id: 'ar.saoodshuraym', ad: 'Saud Al-Shuraim' },
    { id: 'ar.abdurrahmaansudais', ad: 'Abdurrahman Es-Sudeys' },
    { id: 'ar.husary', ad: 'Mahmud Halil el-Husarî' },
    { id: 'ar.minshawi', ad: 'Muhammed Sıddık el-Minşâvî' },
    { id: 'ar.shaatree', ad: 'Ebu Bekir eş-Şâtırî' },
    { id: 'tr.vakfi-audio', ad: 'Türkçe meal sesi (Diyanet Vakfı)' }
];
const SES_BITRATELER = ['128', '64', '192'];

// Eş anlamlı / yazım farkı olan sık aranan kelimeler (normalize edilmiş biçimde)
const ARAMA_ESANLAM = {
    'tevbe': ['tovbe', 'tevbe'],
    'tovbe': ['tovbe', 'tevbe'],
    'namaz': ['namaz', 'salat'],
    'sabir': ['sabir', 'sabr'],
    'sukur': ['sukur', 'sukr'],
    'zekat': ['zekat', 'zekât'],
    'oruc': ['oruc'],
    'dua': ['dua', 'dilek'],
    'cennet': ['cennet'],
    'cehennem': ['cehennem']
};

const KV = {
    ready: false, T: null, P: null, J: null, S: null, N: null, sm: null,
    meal: {}, trN: {}, arN: null, pr: {}, jr: {}, sb: [], toplamSayfa: 604
};

let kSayfa = 1;
let kSecili = -1;
let kMod = lsGet('kuranMod', 'oku');
let kMealId = lsGet('kuranMeal', 'tr.diyanet');
let kHafiz = lsGet('kuranHafiz', 'ar.alafasy');
let kArPunto = lsInt('kuranArPunto', 28);
let kMealPunto = lsInt('kuranMealPunto', 16);
let kuranHazirlaniyor = false;
let aramaDurum = null;
let aramaZamanlayici = null;

const sesNesne = new Audio();
const sesOnYukle = new Audio();
sesOnYukle.preload = 'auto';
let sesIdx = -1;
let sesBitrateNo = 0;

// ---------- Yardımcılar ----------
function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Uzunluğu koruyan Türkçe normalleştirme (vurgulama için)
function normL(s) {
    return String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');
}

function arNorm(s) {
    return String(s).replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
        .replace(/[\u0671\u0623\u0625\u0622]/g, '\u0627')
        .replace(/\u0649/g, '\u064A');
}

function arapcaRakam(n) {
    return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function sureAdi(n) { return SURE_ADLARI[n - 1] || ''; }

function hafizAdi() {
    const h = KURAN_HAFIZLAR.find(x => x.id === kHafiz);
    return h ? h.ad : '';
}

// IndexedDB (büyük veriyi saklamak için; localStorage yetmez)
function idbAc() {
    return new Promise((res, rej) => {
        if (!window.indexedDB) { rej(new Error('IndexedDB yok')); return; }
        const r = indexedDB.open('islam-dunyasi', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
    });
}
async function idbGet(k) {
    try {
        const db = await idbAc();
        return await new Promise((res, rej) => {
            const t = db.transaction('kv', 'readonly').objectStore('kv').get(k);
            t.onsuccess = () => res(t.result);
            t.onerror = () => rej(t.error);
        });
    } catch (e) { return undefined; }
}
async function idbSet(k, v) {
    try {
        const db = await idbAc();
        return await new Promise((res, rej) => {
            const tx = db.transaction('kv', 'readwrite');
            tx.objectStore('kv').put(v, k);
            tx.oncomplete = () => res(true);
            tx.onerror = () => rej(tx.error);
        });
    } catch (e) { return false; }
}

// ---------- Veri indirme ve hazırlama ----------
async function kuranGetir(edisyon) {
    const ctrl = new AbortController();
    const zaman = setTimeout(() => ctrl.abort(), 90000);
    try {
        const res = await fetch('https://api.alquran.cloud/v1/quran/' + edisyon, { signal: ctrl.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        if (!j || !j.data || !j.data.surahs) throw new Error('Beklenmeyen veri biçimi');
        return j.data.surahs;
    } finally {
        clearTimeout(zaman);
    }
}

function arapcaDiziyeCevir(surahs) {
    const T = new Array(TOPLAM_AYET), P = new Array(TOPLAM_AYET), J = new Array(TOPLAM_AYET),
        S = new Array(TOPLAM_AYET), N = new Array(TOPLAM_AYET), sm = [];
    surahs.forEach(s => {
        sm[s.number] = { ad: s.name, rev: s.revelationType, n: s.ayahs.length };
        s.ayahs.forEach(a => {
            const i = a.number - 1;
            T[i] = a.text; P[i] = a.page; J[i] = a.juz; S[i] = s.number; N[i] = a.numberInSurah;
        });
    });
    for (let i = 0; i < TOPLAM_AYET; i++) {
        if (typeof T[i] !== 'string' || !P[i] || !J[i]) throw new Error('Eksik ayet verisi (' + (i + 1) + ')');
    }
    return { T: T, P: P, J: J, S: S, N: N, sm: sm };
}

function mealDiziyeCevir(surahs) {
    const M = new Array(TOPLAM_AYET);
    surahs.forEach(s => s.ayahs.forEach(a => { M[a.number - 1] = a.text; }));
    for (let i = 0; i < TOPLAM_AYET; i++) {
        if (typeof M[i] !== 'string') throw new Error('Eksik meal verisi (' + (i + 1) + ')');
    }
    return M;
}

function veriyiKur(ar, mealler) {
    KV.T = ar.T; KV.P = ar.P; KV.J = ar.J; KV.S = ar.S; KV.N = ar.N; KV.sm = ar.sm;
    KV.meal = mealler;
    KV.pr = {}; KV.jr = {}; KV.sb = [];
    let maks = 1;
    for (let i = 0; i < TOPLAM_AYET; i++) {
        const p = KV.P[i], j = KV.J[i], s = KV.S[i];
        if (!KV.pr[p]) KV.pr[p] = [i, i]; else KV.pr[p][1] = i;
        if (!KV.jr[j]) KV.jr[j] = [p, p]; else { if (p < KV.jr[j][0]) KV.jr[j][0] = p; if (p > KV.jr[j][1]) KV.jr[j][1] = p; }
        if (KV.sb[s] === undefined) KV.sb[s] = i;
        if (p > maks) maks = p;
    }
    KV.toplamSayfa = maks;
    KV.ready = true;
}

function girisDurumYaz(metin, hata) {
    const el = document.getElementById('indir-durum');
    if (!el) return;
    el.innerText = metin || '';
    el.style.color = hata ? '#f87171' : 'var(--muted)';
}

async function kuranHazirla() {
    if (KV.ready || kuranHazirlaniyor) return;
    kuranHazirlaniyor = true;
    try {
        girisDurumYaz('Kayıtlı veriler kontrol ediliyor...');
        const ar = await idbGet('kuran:ar:v1');
        const tr = await idbGet('kuran:tr.diyanet:v1');
        if (ar && tr && ar.T && ar.T.length === TOPLAM_AYET && tr.length === TOPLAM_AYET) {
            const mealler = { 'tr.diyanet': tr };
            const yz = await idbGet('kuran:tr.yazir:v1');
            if (yz && yz.length === TOPLAM_AYET) mealler['tr.yazir'] = yz;
            veriyiKur(ar, mealler);
            if (kMealId !== 'kapali' && !KV.meal[kMealId]) kMealId = 'tr.diyanet';
            kuranEkranGoster();
        } else {
            girisDurumYaz('');
            document.getElementById('okuma-giris').style.display = 'block';
            document.getElementById('okuma-ana').style.display = 'none';
        }
    } finally {
        kuranHazirlaniyor = false;
    }
}

async function kuranVerisiniIndir() {
    const btn = document.getElementById('indir-btn');
    btn.disabled = true;
    try {
        girisDurumYaz('1/2 Arapça metin indiriliyor... (birkaç saniye sürebilir)');
        const ar = arapcaDiziyeCevir(await kuranGetir('quran-uthmani'));
        girisDurumYaz('2/2 Türkçe meal indiriliyor...');
        const tr = mealDiziyeCevir(await kuranGetir('tr.diyanet'));
        await idbSet('kuran:ar:v1', ar);
        await idbSet('kuran:tr.diyanet:v1', tr);
        veriyiKur(ar, { 'tr.diyanet': tr });
        if (kMealId !== 'kapali' && !KV.meal[kMealId]) kMealId = 'tr.diyanet';
        girisDurumYaz('');
        kuranEkranGoster();
    } catch (e) {
        console.error(e);
        girisDurumYaz('İndirme başarısız: ' + e.message + '. Bağlantınızı kontrol edip tekrar deneyin.', true);
    } finally {
        btn.disabled = false;
    }
}

// ---------- Ekran kurulumu ----------
function kuranSeceneklerDoldur() {
    const sureSel = document.getElementById('sure-secim');
    if (sureSel && !sureSel.options.length) {
        sureSel.innerHTML = SURE_ADLARI.map((a, i) => '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + a + '</option>').join('');
    }
    const cuzSel = document.getElementById('cuz-secim');
    if (cuzSel && !cuzSel.options.length) {
        let h = '';
        for (let j = 1; j <= 30; j++) h += '<option value="' + j + '">' + j + '. Cüz</option>';
        cuzSel.innerHTML = h;
    }
    const hafizSel = document.getElementById('okuma-hafiz');
    if (hafizSel && !hafizSel.options.length) {
        hafizSel.innerHTML = KURAN_HAFIZLAR.map(h => '<option value="' + h.id + '">' + h.ad + '</option>').join('');
    }
    if (hafizSel) {
        if (!KURAN_HAFIZLAR.some(h => h.id === kHafiz)) kHafiz = 'ar.alafasy';
        hafizSel.value = kHafiz;
    }
    const mealSel = document.getElementById('meal-secim');
    if (mealSel) mealSel.value = kMealId;
}

function kuranEkranGoster() {
    document.getElementById('okuma-giris').style.display = 'none';
    document.getElementById('okuma-ana').style.display = 'block';
    kuranSeceneklerDoldur();
    const son = lsJSON('kuranSon');
    if (son && son.i >= 0 && son.i < TOPLAM_AYET) kuranGit(KV.P[son.i], son.i, { kaydir: false });
    else kuranGit(1);
    devamGuncelle();
    miniGoster();
}

function kuranBaslangic() {
    kuranSeceneklerDoldur();
    kuranModUygula();
}

function kuranSayfasiAcildi() {
    kuranModUygula();
    if (kMod === 'oku') kuranHazirla();
    miniGoster();
}

// ---------- Oku / Dinle sekmeleri ----------
function kuranModDegistir(mod) {
    kMod = mod;
    lsSet('kuranMod', mod);
    kuranModUygula();
    if (mod === 'oku') kuranHazirla();
    miniGoster();
}

function kuranModUygula() {
    const oku = document.getElementById('kuran-mod-oku');
    const dinle = document.getElementById('kuran-mod-dinle');
    if (!oku || !dinle) return;
    oku.style.display = kMod === 'oku' ? 'block' : 'none';
    dinle.style.display = kMod === 'dinle' ? 'block' : 'none';
    document.querySelectorAll('#kuran-mod-tabs .vakit-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mod === kMod);
    });
}

// ---------- Ayet metni ----------
function ayetArapca(i) {
    let t = KV.T[i];
    if (KV.N[i] === 1 && KV.S[i] !== 1 && KV.S[i] !== 9) {
        const bt = KV.T[0].split(' ');
        const w = t.split(' ');
        if (w.length > bt.length && arNorm(w[0]) === arNorm(bt[0])) t = w.slice(bt.length).join(' ');
    }
    return t;
}

function mealAktifMi() {
    return kMealId !== 'kapali' && !!KV.meal[kMealId];
}

// ---------- Sayfa çizimi ----------
function kuranGit(p, idx, secenek) {
    if (!KV.ready) return;
    p = Math.max(1, Math.min(KV.toplamSayfa, parseInt(p, 10) || 1));
    kSayfa = p;
    const ilk = KV.pr[p][0];
    kSecili = (idx !== undefined && idx >= KV.pr[p][0] && idx <= KV.pr[p][1]) ? idx : ilk;
    sayfaCiz();
    sonKaydet(kSecili);
    const kaydir = !(secenek && secenek.kaydir === false);
    if (idx !== undefined && kaydir) {
        gorunturYap(kSecili);
    } else if (kaydir) {
        const kart = document.getElementById('okuma-sayfa-kart');
        if (kart) kart.scrollIntoView({ block: 'start' });
    }
}

function sayfaCiz() {
    const p = kSayfa;
    const aralik = KV.pr[p];
    const a = aralik[0], b = aralik[1];
    const meal = mealAktifMi() ? KV.meal[kMealId] : null;
    const yerimi = lsJSON('kuranYerimi');
    const yerimiIdx = yerimi ? yerimi.i : -1;
    let html = '';

    if (meal) {
        for (let i = a; i <= b; i++) {
            html += sureBasligiHtml(i);
            html += '<div class="ayet-kart" data-i="' + i + '" onclick="kuranSec(' + i + ')">' +
                '<div class="ayet-ust"><span class="ayet-no">' + KV.S[i] + ':' + KV.N[i] + '</span>' +
                (i === yerimiIdx ? '<span class="isaret">📌 Yer imi</span>' : '') + '</div>' +
                '<div class="okuma-ar">' + escHtml(ayetArapca(i)) + ' <span class="ayet-son">﴿' + arapcaRakam(KV.N[i]) + '﴾</span></div>' +
                '<div class="okuma-meal">' + escHtml(meal[i]) + '</div></div>';
        }
    } else {
        let acik = false;
        for (let i = a; i <= b; i++) {
            if (KV.N[i] === 1) {
                if (acik) { html += '</p>'; acik = false; }
                html += sureBasligiHtml(i);
            }
            if (!acik) { html += '<p class="mushaf-p okuma-ar">'; acik = true; }
            html += '<span class="ayet-span" data-i="' + i + '" onclick="kuranSec(' + i + ')">' + escHtml(ayetArapca(i)) +
                ' <span class="ayet-son">﴿' + arapcaRakam(KV.N[i]) + '﴾</span>' + (i === yerimiIdx ? '<span class="isaret-mini">📌</span>' : '') + '</span> ';
        }
        if (acik) html += '</p>';
    }

    const icerik = document.getElementById('okuma-icerik');
    icerik.style.setProperty('--ar-punto', kArPunto + 'px');
    icerik.style.setProperty('--meal-punto', kMealPunto + 'px');
    icerik.innerHTML = html;

    // Üst bilgi
    const cuz = KV.J[a];
    const cr = KV.jr[cuz];
    const sureler = [];
    for (let i = a; i <= b; i++) { if (sureler.indexOf(KV.S[i]) === -1) sureler.push(KV.S[i]); }
    document.getElementById('okuma-sayfa-no').innerText = 'Sayfa ' + p + ' / ' + KV.toplamSayfa;
    document.getElementById('okuma-sayfa-alt').innerText =
        sureler.map(sureAdi).join(' · ') + ' • Cüz ' + cuz + ' (' + (p - cr[0] + 1) + '/' + (cr[1] - cr[0] + 1) + '. sayfa)';
    document.getElementById('okuma-ilerleme-bar').style.width = (p / KV.toplamSayfa * 100) + '%';
    document.getElementById('cuz-secim').value = cuz;
    document.getElementById('sure-secim').value = KV.S[a];

    kuranSecimiBoya();
    if (sesIdx >= a && sesIdx <= b && !sesNesne.paused) calanIsaretle(sesIdx);
    miniBilgiGuncelle();
}

function sureBasligiHtml(i) {
    if (KV.N[i] !== 1) return '';
    const s = KV.S[i];
    const m = KV.sm[s] || {};
    let h = '<div class="sure-baslik"><div class="sure-tr">' + s + '. ' + escHtml(sureAdi(s)) + ' Suresi</div>' +
        '<div class="sure-ar">' + escHtml(m.ad || '') + '</div>' +
        '<div class="sure-alt">' + SURE_AYET[s - 1] + ' ayet • ' + (m.rev === 'Meccan' ? 'Mekki' : 'Medeni') + '</div></div>';
    if (s !== 1 && s !== 9) h += '<div class="bismillah okuma-ar">' + escHtml(KV.T[0]) + '</div>';
    return h;
}

function kuranSecimiBoya() {
    document.querySelectorAll('#okuma-icerik .secili').forEach(e => e.classList.remove('secili'));
    if (kSecili >= 0) {
        document.querySelectorAll('#okuma-icerik [data-i="' + kSecili + '"]').forEach(e => e.classList.add('secili'));
    }
}

function kuranSec(i) {
    kSecili = i;
    kuranSecimiBoya();
    miniBilgiGuncelle();
}

function gorunturYap(i) {
    const el = document.querySelector('#okuma-icerik [data-i="' + i + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function calanIsaretle(i) {
    document.querySelectorAll('#okuma-icerik .calan').forEach(e => e.classList.remove('calan'));
    if (i >= 0) document.querySelectorAll('#okuma-icerik [data-i="' + i + '"]').forEach(e => e.classList.add('calan'));
}

// ---------- Gezinme ----------
function sayfaGez(d) {
    if (!KV.ready) return;
    const hedef = kSayfa + d;
    if (hedef < 1 || hedef > KV.toplamSayfa) return;
    kuranGit(hedef);
}

function kuranCuzGit(j) {
    j = parseInt(j, 10);
    if (!KV.ready || !KV.jr[j]) return;
    kuranGit(KV.jr[j][0]);
}

function cuzGez(d) {
    if (!KV.ready) return;
    const j = KV.J[KV.pr[kSayfa][0]] + d;
    if (j < 1 || j > 30) return;
    kuranCuzGit(j);
}

function kuranSureGit(n) {
    n = parseInt(n, 10);
    if (!KV.ready || KV.sb[n] === undefined) return;
    const i = KV.sb[n];
    kuranGit(KV.P[i], i);
}

function ayeteGit(s, a) {
    const i = KV.sb[s] + a - 1;
    kuranGit(KV.P[i], i);
}

// Parmakla kaydırma (sola = sonraki sayfa, sağa = önceki)
(function kaydirmaKur() {
    let x0 = 0, y0 = 0, izle = false;
    document.addEventListener('touchstart', function (e) {
        const hedef = e.target.closest ? e.target.closest('#okuma-icerik') : null;
        izle = !!hedef && e.touches.length === 1;
        if (izle) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }
    }, { passive: true });
    document.addEventListener('touchend', function (e) {
        if (!izle) return;
        izle = false;
        const t = e.changedTouches[0];
        const dx = t.clientX - x0, dy = t.clientY - y0;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) sayfaGez(dx < 0 ? 1 : -1);
    }, { passive: true });
})();

// ---------- Kaldığım yer / yer imi ----------
function sonKaydet(i) {
    if (i < 0) return;
    lsSet('kuranSon', JSON.stringify({ i: i, p: KV.P[i] }));
    devamGuncelle();
}

function konumMetni(i) {
    return sureAdi(KV.S[i]) + ' ' + KV.S[i] + ':' + KV.N[i] + ' • Sayfa ' + KV.P[i];
}

function devamGuncelle() {
    const kap = document.getElementById('devam-alani');
    if (!kap || !KV.ready) return;
    const son = lsJSON('kuranSon');
    const yer = lsJSON('kuranYerimi');
    let h = '';
    if (son && son.i >= 0 && son.i < TOPLAM_AYET) {
        h += '<button class="btn devam-btn" onclick="kaldigimYereGit()">▶ Kaldığım yerden devam et<small>' + escHtml(konumMetni(son.i)) + '</small></button>';
    }
    if (yer && yer.i >= 0 && yer.i < TOPLAM_AYET) {
        h += '<button class="btn devam-btn yerimi" onclick="yerimineGit()">📌 Yer imime git<small>' + escHtml(konumMetni(yer.i)) + '</small></button>';
    }
    kap.innerHTML = h;
    const isaretBtn = document.getElementById('mp-isaret');
    if (isaretBtn) isaretBtn.classList.toggle('aktif', !!yer && yer.i === kSecili);
}

function kaldigimYereGit() {
    const son = lsJSON('kuranSon');
    if (son) kuranGit(KV.P[son.i], son.i);
}

function yerimineGit() {
    const yer = lsJSON('kuranYerimi');
    if (yer) kuranGit(KV.P[yer.i], yer.i);
}

function ayetIsaretle() {
    if (kSecili < 0) return;
    const yer = lsJSON('kuranYerimi');
    if (yer && yer.i === kSecili) {
        lsRemove('kuranYerimi');
        mpDurum('Yer imi kaldırıldı');
    } else {
        lsSet('kuranYerimi', JSON.stringify({ i: kSecili, p: KV.P[kSecili] }));
        mpDurum('📌 Yer imi kaydedildi: ' + sureAdi(KV.S[kSecili]) + ' ' + KV.S[kSecili] + ':' + KV.N[kSecili]);
    }
    sayfaCiz();
    devamGuncelle();
}

async function ayetKopyala() {
    if (kSecili < 0) return;
    const i = kSecili;
    let metin = ayetArapca(i);
    const m = KV.meal[mealAktifMi() ? kMealId : 'tr.diyanet'];
    if (m) metin += '\n\n' + m[i];
    metin += '\n— ' + sureAdi(KV.S[i]) + ' Suresi, ' + KV.N[i] + '. ayet (' + KV.S[i] + ':' + KV.N[i] + ')';
    try {
        await navigator.clipboard.writeText(metin);
        mpDurum('📋 Ayet kopyalandı');
    } catch (e) {
        mpDurum('Kopyalanamadı');
    }
}

// ---------- Yazı boyutu, meal, hafız ----------
function kuranPunto(d) {
    kArPunto = Math.max(20, Math.min(46, kArPunto + d * 2));
    kMealPunto = Math.max(13, Math.min(26, kMealPunto + d));
    lsSet('kuranArPunto', kArPunto);
    lsSet('kuranMealPunto', kMealPunto);
    const ic = document.getElementById('okuma-icerik');
    ic.style.setProperty('--ar-punto', kArPunto + 'px');
    ic.style.setProperty('--meal-punto', kMealPunto + 'px');
}

function okumaDurumYaz(metin, hata) {
    const el = document.getElementById('okuma-durum');
    if (!el) return;
    el.innerText = metin || '';
    el.style.color = hata ? '#f87171' : 'var(--muted)';
}

async function mealDegistir() {
    const sel = document.getElementById('meal-secim');
    const yeni = sel.value;
    const eski = kMealId;
    if (yeni === 'kapali' || KV.meal[yeni]) {
        kMealId = yeni;
        lsSet('kuranMeal', yeni);
        if (KV.ready) sayfaCiz();
        return;
    }
    // Seçilen meal ilk kez indirilecek
    okumaDurumYaz('Meal indiriliyor...');
    try {
        const m = mealDiziyeCevir(await kuranGetir(yeni));
        KV.meal[yeni] = m;
        await idbSet('kuran:' + yeni + ':v1', m);
        kMealId = yeni;
        lsSet('kuranMeal', yeni);
        okumaDurumYaz('');
        sayfaCiz();
    } catch (e) {
        console.error(e);
        sel.value = eski;
        okumaDurumYaz('Bu meal şu an indirilemedi (' + e.message + '). Önceki meal korundu.', true);
    }
}

function hafizDegistir() {
    kHafiz = document.getElementById('okuma-hafiz').value;
    lsSet('kuranHafiz', kHafiz);
    sesBitrateNo = 0;
    if (!sesNesne.paused && sesIdx >= 0) ayetCal(sesIdx);
}

// ---------- Ayet sesi ----------
function ayetSesURL(i, bitrate) {
    return 'https://cdn.islamic.network/quran/audio/' + bitrate + '/' + kHafiz + '/' + (i + 1) + '.mp3';
}

function sesYukle(i) {
    sesNesne.src = ayetSesURL(i, SES_BITRATELER[sesBitrateNo]);
    const pr = sesNesne.play();
    if (pr && pr.catch) pr.catch(function () {});
    calanIsaretle(i);
    mediaSessionGuncelle(i);
    if (i + 1 < TOPLAM_AYET) sesOnYukle.src = ayetSesURL(i + 1, SES_BITRATELER[0]);
}

function ayetCal(i) {
    if (!KV.ready || i < 0 || i >= TOPLAM_AYET) return;
    document.querySelectorAll('#kuran-ses-listesi audio').forEach(a => a.pause());
    mpDurum('');
    if (KV.P[i] !== kSayfa) {
        kuranGit(KV.P[i], i);
    } else {
        kuranSec(i);
        sonKaydet(i);
        gorunturYap(i);
    }
    sesIdx = i;
    sesBitrateNo = 0;
    sesYukle(i);
}

function ayetOynatDurdur() {
    if (!KV.ready || kSecili < 0) return;
    if (!sesNesne.paused) { sesNesne.pause(); return; }
    if (sesIdx === kSecili && sesNesne.src && !sesNesne.ended && sesNesne.readyState > 0) {
        const pr = sesNesne.play();
        if (pr && pr.catch) pr.catch(function () {});
    } else {
        ayetCal(kSecili);
    }
}

function ayetGez(d) {
    if (!KV.ready) return;
    const hedef = (kSecili < 0 ? 0 : kSecili) + d;
    if (hedef < 0 || hedef >= TOPLAM_AYET) return;
    if (!sesNesne.paused) {
        ayetCal(hedef);
    } else if (KV.P[hedef] !== kSayfa) {
        kuranGit(KV.P[hedef], hedef);
    } else {
        kuranSec(hedef);
        sonKaydet(hedef);
        gorunturYap(hedef);
    }
}
function ayetOnceki() { ayetGez(-1); }
function ayetSonraki() { ayetGez(1); }

function ayetSesiDurdur() {
    if (!sesNesne.paused) sesNesne.pause();
}

sesNesne.addEventListener('ended', function () {
    if (sesIdx >= 0 && sesIdx < TOPLAM_AYET - 1) ayetCal(sesIdx + 1);
    else { calanIsaretle(-1); miniGuncelle(); }
});
sesNesne.addEventListener('play', miniGuncelle);
sesNesne.addEventListener('pause', miniGuncelle);
sesNesne.addEventListener('error', function () {
    if (sesIdx < 0) return;
    if (sesBitrateNo < SES_BITRATELER.length - 1) {
        sesBitrateNo++;
        sesYukle(sesIdx);
    } else {
        calanIsaretle(-1);
        mpDurum('Ses yüklenemedi. Bağlantınızı kontrol edin veya başka bir hafız seçin.');
        miniGuncelle();
    }
});

function mediaSessionGuncelle(i) {
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: sureAdi(KV.S[i]) + ' ' + KV.S[i] + ':' + KV.N[i],
            artist: hafizAdi(),
            album: "Kur'an-ı Kerim"
        });
        navigator.mediaSession.setActionHandler('play', function () { sesNesne.play(); });
        navigator.mediaSession.setActionHandler('pause', function () { sesNesne.pause(); });
        navigator.mediaSession.setActionHandler('previoustrack', function () { ayetGez(-1); });
        navigator.mediaSession.setActionHandler('nexttrack', function () { ayetGez(1); });
    } catch (e) { /* desteklenmiyor */ }
}

// ---------- Mini oynatıcı ----------
let mpZamanlayici = null;
function mpDurum(metin) {
    const el = document.getElementById('mp-durum');
    if (!el) return;
    el.innerText = metin || '';
    clearTimeout(mpZamanlayici);
    if (metin && metin.indexOf('Ses yüklenemedi') === -1) {
        mpZamanlayici = setTimeout(function () { el.innerText = ''; }, 2500);
    }
}

function miniBilgiGuncelle() {
    const el = document.getElementById('mp-bilgi');
    if (!el) return;
    if (!KV.ready || kSecili < 0) { el.innerText = '—'; return; }
    el.innerText = sureAdi(KV.S[kSecili]) + ' ' + KV.S[kSecili] + ':' + KV.N[kSecili] + ' • ' + hafizAdi();
    const yer = lsJSON('kuranYerimi');
    const b = document.getElementById('mp-isaret');
    if (b) b.classList.toggle('aktif', !!yer && yer.i === kSecili);
}

function miniGuncelle() {
    const b = document.getElementById('mp-play');
    if (b) b.innerText = sesNesne.paused ? '▶' : '⏸';
    miniGoster();
}

function miniGoster() {
    const mp = document.getElementById('mini-player');
    if (!mp) return;
    const kuranAktif = document.getElementById('page-kuran').classList.contains('active') && kMod === 'oku';
    const goster = KV.ready && (kuranAktif || !sesNesne.paused);
    mp.style.display = goster ? 'flex' : 'none';
    document.body.classList.toggle('mini-acik', goster);
}

// ---------- Arama (sure adı, ayet no, anahtar kelime) ----------
function aramaGecikmeli() {
    clearTimeout(aramaZamanlayici);
    aramaZamanlayici = setTimeout(kuranAraYap, 350);
}

function aramaTemizle() {
    document.getElementById('kuran-arama').value = '';
    document.getElementById('kuran-arama-sonuc').innerHTML = '';
    aramaDurum = null;
}

function aramaGit(s, a) {
    aramaTemizle();
    ayeteGit(s, a);
}

function aramaSayfaGit(p) {
    aramaTemizle();
    kuranGit(p);
}

function aramaCuzGit(j) {
    aramaTemizle();
    kuranCuzGit(j);
}

function aramaSatiri(onclick, ust, alt, ek) {
    return '<div class="arama-satir" onclick="' + onclick + '"><div class="arama-ust">' + ust + '</div>' +
        (alt ? '<div class="arama-alt' + (ek || '') + '">' + alt + '</div>' : '') + '</div>';
}

function kelimeVaryantlari(w) {
    const v = [w];
    if (ARAMA_ESANLAM[w]) ARAMA_ESANLAM[w].forEach(x => { if (v.indexOf(x) === -1) v.push(x); });
    // sabır -> sabr gibi ünlü düşmesi
    if (w.length > 3 && /[iuü][bcçdfgğhjklmnprsştvyz]$/.test(w)) {
        const d = w.slice(0, -2) + w.slice(-1);
        if (v.indexOf(d) === -1) v.push(d);
    }
    return v;
}

function aramaMealId() {
    return (kMealId !== 'kapali' && KV.meal[kMealId]) ? kMealId : 'tr.diyanet';
}

function kelimeAra(q) {
    const arap = /[\u0600-\u06FF]/.test(q);
    let dizi, gruplar;
    if (arap) {
        if (!KV.arN) KV.arN = KV.T.map(arNorm);
        dizi = KV.arN;
        gruplar = arNorm(q).split(/\s+/).filter(w => w.length >= 2).map(w => [w]);
    } else {
        const ed = aramaMealId();
        if (!KV.trN[ed]) KV.trN[ed] = KV.meal[ed].map(normL);
        dizi = KV.trN[ed];
        gruplar = normL(q).split(/\s+/).filter(w => w.length >= 2).map(kelimeVaryantlari);
    }
    if (!gruplar.length) return { sonuc: [], gruplar: gruplar, arap: arap };
    const sonuc = [];
    for (let i = 0; i < dizi.length; i++) {
        const t = dizi[i];
        let tamam = true;
        for (let g = 0; g < gruplar.length; g++) {
            let var_ = false;
            for (let k = 0; k < gruplar[g].length; k++) {
                if (t.indexOf(gruplar[g][k]) !== -1) { var_ = true; break; }
            }
            if (!var_) { tamam = false; break; }
        }
        if (tamam) sonuc.push(i);
    }
    return { sonuc: sonuc, gruplar: gruplar, arap: arap };
}

function vurgula(metin, gruplar) {
    const n = normL(metin);
    if (n.length !== metin.length) return escHtml(metin);
    const aralik = [];
    gruplar.forEach(g => g.forEach(v => {
        let pos = 0, k;
        while ((k = n.indexOf(v, pos)) > -1) { aralik.push([k, k + v.length]); pos = k + v.length; }
    }));
    if (!aralik.length) return escHtml(metin);
    aralik.sort((x, y) => x[0] - y[0]);
    const birlesik = [aralik[0].slice()];
    for (let i = 1; i < aralik.length; i++) {
        const son = birlesik[birlesik.length - 1];
        if (aralik[i][0] <= son[1]) son[1] = Math.max(son[1], aralik[i][1]);
        else birlesik.push(aralik[i].slice());
    }
    let h = '', c = 0;
    birlesik.forEach(r => {
        h += escHtml(metin.slice(c, r[0])) + '<mark>' + escHtml(metin.slice(r[0], r[1])) + '</mark>';
        c = r[1];
    });
    return h + escHtml(metin.slice(c));
}

function kuranAraYap() {
    const kap = document.getElementById('kuran-arama-sonuc');
    const q = document.getElementById('kuran-arama').value.trim();
    aramaDurum = null;
    if (!q) { kap.innerHTML = ''; return; }
    if (!KV.ready) { kap.innerHTML = '<div class="empty-state">Önce Kur\'an verisini indirin.</div>'; return; }

    const nq = norm(q);
    let h = '';

    // 1) 2:255 / 2 255 / 2.255
    let m = q.match(/^(\d{1,3})\s*[:.,\-\s]\s*(\d{1,3})$/);
    if (m) {
        const s = parseInt(m[1], 10), a = parseInt(m[2], 10);
        if (s >= 1 && s <= 114 && a >= 1 && a <= SURE_AYET[s - 1]) {
            const i = KV.sb[s] + a - 1;
            h += aramaSatiri('aramaGit(' + s + ',' + a + ')', '➡ ' + escHtml(sureAdi(s)) + ' Suresi, ' + a + '. ayet',
                'Sayfa ' + KV.P[i] + ' • Cüz ' + KV.J[i]);
        } else {
            h += '<div class="empty-state">Geçersiz ayet. ' + (s >= 1 && s <= 114 ? escHtml(sureAdi(s)) + ' suresi ' + SURE_AYET[s - 1] + ' ayettir.' : 'Sure numarası 1-114 olmalı.') + '</div>';
        }
        kap.innerHTML = h;
        return;
    }

    // 2) yalnızca sayı: sure / sayfa / cüz
    if (/^\d+$/.test(q)) {
        const n = parseInt(q, 10);
        if (n >= 1 && n <= 114) h += aramaSatiri('aramaGit(' + n + ',1)', '📖 ' + n + '. sure: ' + escHtml(sureAdi(n)), SURE_AYET[n - 1] + ' ayet');
        if (n >= 1 && n <= KV.toplamSayfa) h += aramaSatiri('aramaSayfaGit(' + n + ')', '📄 ' + n + '. sayfa');
        if (n >= 1 && n <= 30) h += aramaSatiri('aramaCuzGit(' + n + ')', '📚 ' + n + '. cüz');
        kap.innerHTML = h || '<div class="empty-state">Sonuç bulunamadı.</div>';
        return;
    }

    // 3) "sayfa 42", "cüz 3"
    m = nq.match(/^(sayfa|cuz)\s*(\d+)$/);
    if (m) {
        const n = parseInt(m[2], 10);
        if (m[1] === 'sayfa' && n >= 1 && n <= KV.toplamSayfa) h = aramaSatiri('aramaSayfaGit(' + n + ')', '📄 ' + n + '. sayfa');
        else if (m[1] === 'cuz' && n >= 1 && n <= 30) h = aramaSatiri('aramaCuzGit(' + n + ')', '📚 ' + n + '. cüz');
        kap.innerHTML = h || '<div class="empty-state">Sonuç bulunamadı.</div>';
        return;
    }

    // 4) kısayollar (Ayetel Kürsi vb.)
    KISAYOLLAR.forEach(k => {
        if (k.k.some(x => nq === x || (nq.length >= 4 && x.indexOf(nq) !== -1))) {
            h += aramaSatiri('aramaGit(' + k.s + ',' + k.a + ')', '⭐ ' + escHtml(k.ad), 'Sayfa ' + KV.P[KV.sb[k.s] + k.a - 1]);
        }
    });

    // 5) sure adı
    if (nq.length >= 2) {
        SURE_ADLARI.forEach((ad, idx) => {
            if (norm(ad).indexOf(nq) !== -1) {
                h += aramaSatiri('aramaGit(' + (idx + 1) + ',1)', '📖 ' + (idx + 1) + '. ' + escHtml(ad) + ' Suresi',
                    SURE_AYET[idx] + ' ayet • Sayfa ' + KV.P[KV.sb[idx + 1]]);
            }
        });
    }

    // 6) kelime araması (meal veya Arapça)
    const r = kelimeAra(q);
    aramaDurum = { sonuc: r.sonuc, gruplar: r.gruplar, arap: r.arap, limit: 30, onek: h };
    aramaSonucCiz();
}

function aramaSonucCiz() {
    const kap = document.getElementById('kuran-arama-sonuc');
    const d = aramaDurum;
    if (!d) return;
    let h = d.onek;
    const toplam = d.sonuc.length;
    if (toplam) {
        h += '<div class="arama-ozet">' + toplam + ' ayette bulundu' + (d.arap ? ' (Arapça metin)' : ' (' + (aramaMealId() === 'tr.yazir' ? 'Elmalılı' : 'Diyanet') + ' meali)') + '</div>';
        d.sonuc.slice(0, d.limit).forEach(i => {
            const s = KV.S[i], a = KV.N[i];
            const metin = d.arap ? escHtml(ayetArapca(i)) : vurgula(KV.meal[aramaMealId()][i], d.gruplar);
            h += aramaSatiri('aramaGit(' + s + ',' + a + ')',
                escHtml(sureAdi(s)) + ' ' + s + ':' + a + ' <small>• Sayfa ' + KV.P[i] + '</small>', metin, d.arap ? ' ar' : '');
        });
        if (toplam > d.limit) {
            h += '<button class="btn btn-secondary" style="margin-top:8px;" onclick="aramaDahaFazla()">Daha fazla göster (' + (toplam - d.limit) + ')</button>';
        }
    } else if (!d.onek) {
        h += '<div class="empty-state">Sonuç bulunamadı. Başka bir kelime deneyin.</div>';
    }
    kap.innerHTML = h;
}

function aramaDahaFazla() {
    if (!aramaDurum) return;
    aramaDurum.limit += 30;
    aramaSonucCiz();
}

// =====================================================
// 9. SAYFA DEĞİŞTİRME
// =====================================================
function sayfaDegistir(pageId, element) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById('page-' + pageId).classList.add('active');
    element.classList.add('active');
    lsSet('sonSayfa', pageId);
    window.scrollTo(0, 0);

    if (pageId === 'kible') {
        setTimeout(kibleSayfasiAcildi, 200);
    }
    if (pageId === 'bayramlar') {
        siradakiBayramiHesapla();
    }
    if (pageId === 'kuran') {
        kuranSayfasiAcildi();
    }
    miniGoster();
}

document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('nav-item')) {
        e.preventDefault();
        e.target.click();
    }
});

// =====================================================
// İLKLENDİRME
// =====================================================
document.addEventListener("DOMContentLoaded", function() {
    zikirCiz();

    // Kayıtlı şehir
    const kayitliSehir = lsGet('sehir', 'Ankara');
    const sel = document.getElementById('sehir-secim');
    if (sel.querySelector('option[value="' + kayitliSehir + '"]')) sel.value = kayitliSehir;

    duaKategoriDegistir('dualari', document.querySelector('#page-dualar .vakit-tab'));
    esmalariYukle(esmaVeritabani);
    kuranListesiniGuncelle();
    kuranBaslangic();
    bugunBilgisiYaz();
    siradakiBayramiHesapla();
    eskiVakitCachetemizle();

    if (lsGet('vakitModu', 'sehir') === 'gps') vakitleriKonumdanGetir();
    else vakitleriGuncelle();

    // Canlı sayaçlar
    setInterval(function () {
        sonrakiVakitGuncelle();
        if (document.getElementById('page-bayramlar').classList.contains('active')) geriSayimCiz();
    }, 1000);

    // Gün değişince başlık ve vakitleri tazele
    let sonGun = bugunIso();
    setInterval(function () {
        const g = bugunIso();
        if (g !== sonGun) {
            sonGun = g;
            bugunBilgisiYaz();
            bayramBannerGuncelle();
            if (lsGet('vakitModu', 'sehir') === 'gps') vakitleriKonumdanGetir();
            else vakitleriGuncelle();
        }
    }, 60000);

    // Son açık sayfaya dön (Kıble hariç: izin istemlerini kendiliğinden tetiklemesin)
    const sonSayfa = lsGet('sonSayfa', 'zikir');
    if (sonSayfa !== 'zikir' && sonSayfa !== 'kible') {
        const nav = document.querySelector('.nav-item[data-page="' + sonSayfa + '"]');
        if (nav) sayfaDegistir(sonSayfa, nav);
    }
});
