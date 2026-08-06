/* Charts — internal song database.
   This file is rewritten by the local preview server when songs are edited
   in the browser, and is meant to stay hand-editable.

   body   "over" format: chord symbols on their own line, column-aligned
          above the lyric line below. "inline" format: [Cm] markers in the
          text. Lines like [Verse] that aren't a chord are section labels.
          A trailing "x2" on a lyric line becomes a repeat badge.
   bars   optional bar chart: bars split by "|", several chords in one bar
          split by spaces, "·" = empty bar, "|: ... :|" marks a repeated
          span, trailing "x2" = repeat. A plain
          text line right after a row is that row's lyric caption.
          If missing, bars are derived from the body (one bar per chord). */

window.CHARTS_DB = [
  {
    id: "mabel-matiz-ne-olursun",
    title: "Ne Olursun",
    artist: "Mabel Matiz",
    key: "Em",
    source: "https://www.repertuarim.com/akor/mabel-matiz-ne-olursun-akor-5609.html",
    video: "https://www.youtube.com/watch?v=bzRgN7wCiXE",
    format: "over",
    body: `
Em                              D     Am      Em
Gel gönlümü, yerden yere, vurma güzel ne olursun  x2
Am            Em        D           Em
Gül dururken dikenleri, derme güzel ne olursun  x2

Em           D            Am          D   Em
Git diyemem, kal diyemem, sen goncasın, gül diyemem  x2
Am           Em          D           Em
Çok severim, söyleyemem, sorma güzel ne olursun  x2

Em                               D       Am   Em
Sevgin nefes, sevgin candır, sevgin bana heyecandır  x2
Am          Em            D           Em
Kalbim ince bir fidandır, kırma güzel ne olursun  x2
`,
    bars: `
Em | Em | D Am | Em   x2
Gel gönlümü, yerden yere, vurma güzel ne olursun
Am | Em | D | Em   x2
Gül dururken dikenleri, derme güzel ne olursun

Em | D | Am | D Em   x2
Git diyemem, kal diyemem, sen goncasın, gül diyemem
Am | Em | D | Em   x2
Çok severim, söyleyemem, sorma güzel ne olursun

Em | Em | D Am | Em   x2
Sevgin nefes, sevgin candır, sevgin bana heyecandır
Am | Em | D | Em   x2
Kalbim ince bir fidandır, kırma güzel ne olursun
`,
    arrangement: `
Verse: |: Em | % | Em D | Am Em :|
       |: Am | Em | D | Em :|
Chorus: |: Em | D | Am | D Em :|
        |: Am | Em | D | Em :|

order: Verse, Chorus, Verse, Chorus
`
  },
  {
    id: "levent-yuksel-istanbul",
    title: "İstanbul",
    artist: "Levent Yüksel",
    key: "Am",
    source: "https://dogruakor.com/repertuar/Levent+Y%C3%BCksel/%C4%B0stanbul",
    video: "https://www.youtube.com/watch?v=_OXskGao8Nw",
    format: "over",
    body: `
[Intro]
Am  |  |  Dm
Dm  Am  E  Am  E  Am

       Am     Bm7b5
Saçlarını dağıtır rüzgar
      Am       Bm7b5
Yeditepe üzerinden
      Dm       E          F#m7b5   B7
Hatıralar, tarihin küllerini   savurur
        Em           D        C
Kadın gibi, kısrak gibi sarılayım
             E7
Gel ince beline
         Am           F#m7b5   E
Yarim İstanbul gel öpeyim gerdanından

[Ara]
Am  |  |  Dm
Dm  Am  E  Am  E  Am

       Am     Bm7b5
Tüketilmiş yaşanmamış
      Am       Bm7b5       Dm
Hediyelik hayatlar ah bu evler,
       E           F#m7b5     B7
Pencereler, bu kapılar,  sokaklar
        Em        D
Hüzün gibi sevinç gibi,
       C        E7
Eskitilmiş zamanlar
        Am            F#m7b5    E
Yarim İstanbul gel öpeyim  gerdanından

[Ara]
Am  |  |  Dm
Dm  Am  E  Am  E  Am

      Am     Bm7b5         Am     Bm7b5
Minareler uzanmış   gökyüzüne bağırır
        Dm         E
Kara sevdan nerelerden
      F#m7b5   B7
Yüregimi   çağırır
      Em         D         C          E
Dua gibi, büyü gibi ezberledim hasretini
        Am            F#m7b5    E
Yarim İstanbul gel öpeyim  gerdanından

[Ara]
Am  |  |  |  x4
Dm  Am  E  Am  E  Am

       Am     Bm7b5
Saçlarını dağıtır rüzgar
      Am       Bm7b5
Yeditepe üzerinden
      Dm       E          F#m7b5   B7
Hatıralar, tarihin küllerini   savurur
        Em           D        C
Kadın gibi, kısrak gibi sarılayım
             E7
Gel ince beline
         Am           F#m7b5   E
Yarim İstanbul gel öpeyim gerdanından
`,
    bars: `
[Intro]
Am | · | · | Dm
Dm | Am | E | Am | E | Am

Am | Bm7b5
Saçlarını dağıtır rüzgar
Am | Bm7b5
Yeditepe üzerinden
Dm | E | F#m7b5 | B7
Hatıralar, tarihin küllerini   savurur
Em | D | C
Kadın gibi, kısrak gibi sarılayım
E7
Gel ince beline
Am | F#m7b5 | E
Yarim İstanbul gel öpeyim gerdanından

[Ara]
Am | · | · | Dm
Dm | Am | E | Am | E | Am

Am | Bm7b5
Tüketilmiş yaşanmamış
Am | Bm7b5 | Dm
Hediyelik hayatlar ah bu evler,
E | F#m7b5 | B7
Pencereler, bu kapılar,  sokaklar
Em | D
Hüzün gibi sevinç gibi,
C | E7
Eskitilmiş zamanlar
Am | F#m7b5 | E
Yarim İstanbul gel öpeyim  gerdanından

[Ara]
Am | · | · | Dm
Dm | Am | E | Am | E | Am

Am | Bm7b5 | Am | Bm7b5
Minareler uzanmış   gökyüzüne bağırır
Dm | E
Kara sevdan nerelerden
F#m7b5 | B7
Yüregimi   çağırır
Em | D | C | E
Dua gibi, büyü gibi ezberledim hasretini
Am | F#m7b5 | E
Yarim İstanbul gel öpeyim  gerdanından

[Ara]
Am | · | · | ·   x4
Dm | Am | E | Am | E | Am

Am | Bm7b5
Saçlarını dağıtır rüzgar
Am | Bm7b5
Yeditepe üzerinden
Dm | E | F#m7b5 | B7
Hatıralar, tarihin küllerini   savurur
Em | D | C
Kadın gibi, kısrak gibi sarılayım
E7
Gel ince beline
Am | F#m7b5 | E
Yarim İstanbul gel öpeyim gerdanından
`,
    arrangement: `
Chorus: Am | % | % | Dm
        Dm Am | E Am | E | Am E Am
Verse: Am Bm7b5 | Am Bm7b5 | Dm E | F#m7b5 B7
       Em D | C E7 | Am F#m7b5 | E

order: Chorus, Verse, Chorus, Verse, Chorus, Verse, Solo, Verse
`
  },
  {
    id: "kenan-dogulu-tutamiyorum-zamani",
    title: "Tutamıyorum Zamanı",
    artist: "Kenan Doğulu",
    key: "Bm",
    source: "https://akor.gitaregitim.net/tutamiyorum-zamani-akor-kolay-versiyon/",
    video: "https://www.youtube.com/watch?v=xGzDUYPr0GQ",
    format: "over",
    body: `
     Bm            Bm           Bm   Bm
İnadına yenilmeden aşık olmadan gel
       Bm            Bm             Em   Em
Bu gidişin sonu kötü kalbi kaybetme gel
      Em              Bm
Siyahını bırak da gel derdi sil yeter
Em            Bm
Aşka zulmedip küsmesen yeter
F#           F#              F#   F#
 Şafağım kararır daralır geceler

       Bm             Bm              Bm   Bm
Yerine hiç beni koyup sarhoş oldun mu sen
      Bm            Bm               Em   Em
Kaderine boyun eğip dününe küstün mü sen
      Em             Bm
Yüreğine cayır cayır kor çile saçıp
Em            F#
Göz göre göre korku saklayıp
F#            F#         F#  F#
 Boğazına gömülüp sustun mu hiç

Bm    Bm            Em       Em
Kaaal  gittiğin yerde mutlu oool
      F#     F#           Bm        Bm
Ya da geeeel  kalbimde tahta sahip oool
      Bm              Bm          Em     Em
Senin gülen yüzüne kurban bu serseri kalbim
    F#            F#          Bm   Bm
Ama karar ver tutamıyorum zamanı
----------------------o-----------------------
akor.gitaregitim.net sitesinde yayınlanmıştır.
`,
    bars: `
Bm | Bm | Bm | Bm
İnadına yenilmeden aşık olmadan gel
Bm | Bm | Em | Em
Bu gidişin sonu kötü kalbi kaybetme gel
Em | Bm
Siyahını bırak da gel derdi sil yeter
Em | Bm
Aşka zulmedip küsmesen yeter
F# | F# | F# | F#
Şafağım kararır daralır geceler

Bm | Bm | Bm | Bm
Yerine hiç beni koyup sarhoş oldun mu sen
Bm | Bm | Em | Em
Kaderine boyun eğip dününe küstün mü sen
Em | Bm
Yüreğine cayır cayır kor çile saçıp
Em | F#
Göz göre göre korku saklayıp
F# | F# | F# | F#
Boğazına gömülüp sustun mu hiç

Bm | Bm | Em | Em
Kaaal  gittiğin yerde mutlu oool
F# | F# | Bm | Bm
Ya da geeeel  kalbimde tahta sahip oool
Bm | Bm | Em | Em
Senin gülen yüzüne kurban bu serseri kalbim
F# | F# | Bm | Bm
Ama karar ver tutamıyorum zamanı
`,
    arrangement: `
Verse: Bm | % | % | %
       Bm | % | Em | %
       Em | % | G | %
       Em | % | F# | %
Chorus: Bm | % | Em | %
        F# | % | Bm | %
        Bm | % | Em | %
        Em | F# | Bm | %

order: Verse, Verse, Chorus, Chorus, Verse, Chorus, Chorus, Outro
`
  },
  {
    id: "ozdemir-erdogan-gurbet",
    title: "Gurbet",
    artist: "Özdemir Erdoğan",
    key: "Em",
    source: "https://akorlar.com/ozdemir-erdogan-gurbet",
    video: "https://www.youtube.com/watch?v=FczUnHuaixE",
    format: "over",
    body: `
Am   Em  D   Em  Am   Em  D   Em

G
Of
G                   D                   Em
Kime desem derdimi ben bulutlar
G                 D             Em
Bizi dost bildiklerimiz vurdular
A                    D                G                   Em
Bir de gurbet yarası var hepsinden derin  x2
Am        D                      G                   Em
Söyleyin memleketten bir haber mi var
C                 Bm             Em      D          Em
Yoksa yarin gözyaşları mı bu yağmurlar  x2

Am         Em                 D                   Em
İçerim yanıyor yar yar yaram pek derin
Am            Em                   D                  Em
Bana nazlı yardan aman bir haber verin

Am   Em  D   Em  Am   Em  D   Em

G
Of
G                   D             Em
Bulutlar yarime selam söyleyin
G                    D                Em
Kavuşma gününüz yakınmış deyin
A                     D             G
Felek yardan ırak koyduysa bizi  x2
Am               D                  G      Em
Gurbet elde bir başıma neyleyim
C                  Bm           Em   D    Em
Yardan ırak yaşanır mı      söyleyin
`,
    arrangement: `
Intro: Am | Em | D | Em   x4
Verse: G | G
       G D | Em   x2
       Am D | G Em   x2
       C Bm | Em D Em
       Am D | G Em
       C Bm | Em D Em
Chorus: Am | Em | D | Em   x4

order: Intro, Verse, Chorus, Intro, Verse, Chorus, Intro
`
  },
  {
    id: "ibrahim-tatlises-gulum-benim",
    title: "Gülüm Benim",
    artist: "İbrahim Tatlıses",
    key: "C",
    source: "https://akorlar.com/ibrahim-tatlises-gulum-benim",
    video: "https://www.youtube.com/watch?v=pyc-JOP0u1w",
    format: "over",
    body: `
C
Kalbimdeki tatlı sızı
C#                     C
Sensin bu gönlümün yazı
 C
Bakışların öyle güzel
C#               C
Öldürüyor beni nazın
Fm
Ufkumdaki çiçek gibi
C
İçimdeki nefes gibi
C#
Ne bir heves ne bir tutku
C
Kara sevda benimkisi

Fm                   C
Gülüm benim gülüm benim
C#                      C
Derdim aşkım canım benim
                  C#
Ayırmasın tanrim bizi
                    C#        C
budur inan tek dileğim
`,
    arrangement: `
Verse: C | % | C# | A#m   x2
       Fm | % | C | %
       C# | % | A#m | C
Chorus: Fm | C | C# | A#m   x4

order: Intro, Verse, Chorus, Intro, Verse, Chorus, Outro
`
  },
  {
    id: "yasar-divane",
    title: "Divane",
    artist: "Yaşar",
    key: "Am",
    source: "https://akorlar.com/yasar-divane",
    video: "https://www.youtube.com/watch?v=HhucJr-9MCk",
    format: "over",
    body: `
Am                                 A           Dm
Hele bir anla aşkı zamanla kışlar bahara döner gibidir
                              E                       Am
Var mı dünyada aşkından başka yandı derken söner gibidir
                                      A             Dm
Her derdime yar ortağım ol da, gökten melekler iner gibidir o zaman
                                E                  Am
Kar mi dünyada bin yil yasansa yoklugunda cehennem gibidir

Am                 Dm        E          Am
Sana yine muhtacım gel benim baştacım yar
                  Dm            E          Am
Bana yine sen lazımsın gel benim sultanım yar

F                E            Dm            F    E
Ay aman yar sana söylemeliyim içimde tutamam yar
                                        E
Tutamam yar unutamam yar ölüm var dünyada
                                Am
Tutamam yar unutamam yar  ay ay

Am                   Dm        E            Am
Yeri göğü deldin yar bana geri geldin mi yar
            Dm                 E          Am
Bana divane diyorlar yok artık uslandım yar

Am                                A            Dm
Hele bir anla aşkı zamanla kışlar bahara döner gibidir
                                          E                Am
Var mı dünyada aşkından başka aşk sevdiğim şehirler gibidir
                                                A                                                          Dm
Her derdime yar ortağım ol da, gökten melekler iner gibidir o zaman
                                            E                                                       Am
Al aşkımı yar ah ver aşkını yar aşk, kışın doğan güneşler gibidir
`,
    arrangement: `
Verse x2: Am | % | A | Dm
          Dm | % | Dm E | Am
Chorus: Am | Dm | E | Am   x4
Bridge: F | % | % | E
        Dm | % | F | E
Pre-Chorus: E   x4
Intro: Am | Dm   x4
       Am | %

order: Intro, Verse, Chorus, Bridge, Pre-Chorus, Chorus, Intro, Verse, Chorus, Bridge, Pre-Chorus, Chorus
`
  },
  {
    id: "yildiz-tilbe-sana-deger",
    title: "Sana Değer",
    artist: "Yıldız Tilbe",
    key: "A",
    source: "https://akorlar.com/yildiz-tilbe-sana-deger",
    video: "https://www.youtube.com/watch?v=_Qw1l1BbJwM",
    format: "over",
    body: `
A                                                Gm                       A#          A
Akarım sonsuza deli sel gibi, tut çevrele tut gölün olayım
A                                                     Gm                           A#         A
Çarparım ne varsa deli yel gibi, tut kollarımdan tut ki durayım

Dm                        Gm             C      F                            A#
Tüm yaşananlar bir bir günaha, dönüşüyor ah zamanla uğraşma
A#          Gm   A#                A     Gm               A#          A
Sen öyle bela deli sev ki beni, bütün yasakları yasakla

A                                                   Gm                 A#             A
Her soluğunda baştan ayağa, çek beni içine orda kalayım

A  A#  C  Dm          C       A#             Dm   C        A#
Zaten aşklar hep yalan dolan, sonu hep sızı hüsran
       C             Am            Gm                A#                A
Geriye kalan ardından, yalnızlık olsa da sana değer
`,
    arrangement: `
A: A | % | Gm | A# A   x2
B x2: Dm | % | C | F
      A# | Gm | A# | Gm A
C x2: - A A# C
      Dm C | A# | Dm C | A#
      C | Am | Gm | A# A

order: A, B, A, C, A, B, A, C
`
  },
  {
    id: "yildiz-tilbe-ummadigim-anda",
    title: "Ummadığım Anda",
    artist: "Yıldız Tilbe",
    key: "Dm",
    source: "https://www.repertuarim.com/akor/yildiz-tilbe-ummadigim-anda-akor-5337.html",
    video: "https://www.youtube.com/watch?v=pmuexLIxwKE",
    format: "over",
    body: `
Am               Bb            Am                Gm
Mektupları resimleri kaldıramam ki
C                      Bb                  Gm           Am
Sevdim seni başkasına yar edemem ki
Dm                                            Gm
İki dünya bir araya gelse imkansız
C                      Bb             Gm               Am
Seni benden başkasıyla düşünemem ki

F                                                     D      Gm
Sevgilim kıskanırlar, yalanlar anlatırlar
                              Bb              Am
Bizi ayıramazlar, aşkın dizinden

Dm                                                           Gm
Ben düşerken yükseklerden uçurumlara
C                   Bb               Gm                      Am
Aşkın tuttu ellerimden ummadığım anda
Dm                                                    Gm
Şimdi senle hayat rüya düşlerim gerçek
C                      Bb                 Gm                   Am
Sanki ben hiç yaşamadım seni tanıyana dek

Am              Bb           Am           Gm
Bahar dalı çiçek dili yeşilin rengi
C                      Bb            Gm        Am
Anlatmanın imkanı yok güzelliğini
Am             Bb            Am                 Gm
Sana susuz açım sana hastayım sana
C                     Bb                   Gm        Am
Hiçbir sebep seni benden ayıramaz ki

B bölümü

Nakarat
`,
    arrangement: `
Verse: Am | Bb | Am | Gm | C | Bb | Gm | Am | Dm | Gm | C | Bb | Gm | Am
Chorus: F | D | Gm | Bb | Am
Bridge: Dm | Gm | C | Bb | Gm | Am | Dm | Gm | C | Bb | Gm | Am
Part 4: Am | Bb | Am | Gm | C | Bb | Gm | Am | % | Bb | Am | Gm | C | Bb | Gm | Am

order: Verse, Chorus, Bridge, Part 4
`
  },
  {
    id: "muzeyyen-senar-elveda-meyhaneci",
    title: "Elveda Meyhaneci",
    artist: "Müzeyyen Senar",
    key: "A",
    source: "https://akorlar.com/zeki-muren-elveda-meyhaneci",
    video: "https://www.youtube.com/watch?v=eGdW2JCfxLg",
    format: "over",
    body: `
Dm               Gm         A
Elvada meyhaneci artik kalamiyorum
Gm                    A#     Dm
Bir baskayim bu aksam sarhos olamiyorum

Dm              A                Gm
Aynı kadeh ayni mey bir tat alamiyorum
Gm                A#             A
Allahim bu nasil sey sarhos olamiyorum

Dm                   Gm          A
Ne yerde ne gokteyim bir garip seferdeyim
Gm                  A#          Dm
Asikmiyim ben neyim sarhos olamiyorum

Dm              A                Gm
Aynı kadeh ayni mey bir tat alamiyorum
Gm                A#             A
Allahim bu nasil sey sarhos olamiyorum
`,
    arrangement: `
Verse x2: Dm | % | Gm | A
          Gm | % | A# | Dm
Chorus x2: Dm | % | A | %
           Gm | % | A# | A

order: Intro (C), Verse, Chorus, Intro (C), Verse, Chorus
`
  },
  {
    id: "ahmet-kaya-ada-sahilleri",
    title: "Ada Sahilleri",
    artist: "Ahmet Kaya",
    key: "G",
    source: "https://akorlar.com/turk-sanat-muzigi-ada-sahilleri",
    video: "https://www.youtube.com/watch?v=dySoik0yzVk",
    format: "over",
    body: `
G G# G G#  G G# G G#

G                         Fm
Ada sahillerinde bekliyorum
                   Cm
Her zaman yollarını gözlüyorum
                    G
Seni senden güzelim istiyorum
 G#   Fm    G#         Fm           G
Beni şadet şadiye başın için

G G# G G#  G G# G G#

G                              Fm
Nerede o misgibi leylaklar
                                          Cm
Sararıp solmak üzre yapraklar
                                                   G
Bana mesken olunca topraklar
 G#    Fm       G#         Fm       G
Beni yadet  güzelim başın için
`,
    arrangement: `
Intro: G G#   x4
Verse x2: G
          G | Fm | % | Cm
          Cm | G | G# | Fm

order: Intro, Verse, Instrumental (V), Verse, Instrumental (V), Verse
`
  },
  {
    id: "ebru-gundes-senin-olmaya-geldim",
    title: "Senin Olmaya Geldim",
    artist: "Ebru Gündeş",
    key: "Am",
    source: "https://akorlar.com/ebru-gundes-senin-olmaya-geldim",
    video: "https://www.youtube.com/watch?v=UgjhmUdSeT8",
    format: "over",
    body: `
Em        Am          F        Dm
Dün akşam,yine benim yollarıma bakmışsın
G          Am      Dm      Em
Gelmeyince üzülüp,perdeyi kapatmışsın

Em              Am          F                Dm
Kalbindeki derdine derman olmaya geldim
G                Dm            F             Dm        Em
Sakın artık üzülme sende kalmaya geldim
Em         Am           F              Dm
Yıllar varki hasretim o güzel yüzüne
G               Am             F        Dm      Em
kararlıyım bu gece senin olmaya geldim..

Em            Am            F            Dm
Benim için aglayıp,gözyaşları dökmüşsün
G                Am         Dm          Em
Yollarıma bakıpta,hep boynunu bükmüşsün
`,
    bars: `
Em | Am | F | Dm
Dün akşam,yine benim yollarıma bakmışsın
G | Am | Dm | Em
Gelmeyince üzülüp,perdeyi kapatmışsın

Em | Am | F | Dm
Kalbindeki derdine derman olmaya geldim
G | Dm | F | Dm | Em
Sakın artık üzülme sende kalmaya geldim
Em | Am | F | Dm
Yıllar varki hasretim o güzel yüzüne
G | Am | F | Dm | Em
kararlıyım bu gece senin olmaya geldim..

Em | Am | F | Dm
Benim için aglayıp,gözyaşları dökmüşsün
G | Am | Dm | Em
Yollarıma bakıpta,hep boynunu bükmüşsün
`,
    arrangement: `
Verse x2: Em | Am | F | Dm
          G | Am | Dm | Em
Chorus x3: Em | Am | F | Dm
           G | Dm | F | Dm Em

order: Verse, Chorus, Verse, Chorus
`
  },
  {
    id: "gonul-akkor-boyle-gelmis-boyle-gecer",
    title: "Böyle Gelmiş Böyle Geçer",
    artist: "Gönül Akkor",
    key: "Cm",
    source: "https://www.repertuarim.com/akor/deniz-seki-boyle-gelmis-boyle-gecer-akor-3833.html",
    video: "https://www.youtube.com/watch?v=47KsZBVga2Q",
    format: "over",
    body: `
Cm                                   Fm
Böyle gelmiş böyle, böyle geçer dünya
Fm               Cm       G
Günlerimiz bitecek bir gün saya saya  x2

Cm                             Fm
Seneler koşuyor  gülüp ağlatıyor
Fm                Cm      G
Bir kez bak aynaya ömrümüz geçiyor  x2

Cm      G    Cm    Fm
Neşe keder hepsi geçer
        Fm    Cm    G
Bize kar kalan nedir bu dünyadan  x2

Cm                                Fm
Daha dün çocuktuk sokaklarda koştuk
Fm            Cm        G
Yarın belki göç var bu dünya olamaz ya  x2
`,
    bars: `
Cm | Fm
Böyle gelmiş böyle, böyle geçer dünya
Fm | Cm | G   x2
Günlerimiz bitecek bir gün saya saya

Cm | Fm
Seneler koşuyor  gülüp ağlatıyor
Fm | Cm | G | Cm
Bir yol aynaya ömrümüz geçiyor
Fm | Cm | G   x2
Bir kez bak aynaya ömrümüz geçiyor

Cm | G | Cm | Fm
Neşe keder hepsi geçer
Fm | Cm | G | Cm   x2
Bize kar kalan nedir bu dünyadan

Cm | Fm
Daha dün çocuktuk sokaklarda koştuk
Fm | Cm | G | Cm   x2
Yarın belki göç var bu dünya olamaz ya
`,
    arrangement: `
Chorus x2: Cm | Cm Fm
           Fm Cm | G Cm   x2
Verse: Cm G | Cm Fm
       Fm Cm | G Cm   x2

order: Chorus, Verse, Chorus, Chorus, Verse, Chorus
`
  },
  {
    id: "sezen-aksu-keskin-bicak",
    title: "Keskin Bıçak",
    artist: "Sezen Aksu",
    key: "A hicaz",
    source: "https://akorlar.com/sezen-aksu-keskin-bicak",
    video: "https://www.youtube.com/watch?v=kR0EX8XK-8I",
    format: "over",
    body: `
A                     Dm
Geldim  yarım kaldım  yarım
             A              Dm
Neydi  ne oldu  şu  tez  canım
              A#                  Gm
Ertelendim hayattan  sevdim  yarım
                                  A
Derken  bugün  olmasa  olur yarın

A
Kendinden kaçak
A              Dm
Yarim  keskin  bıçak
F               C
Nerde  bende  o yürek
A#       A        A#        A
Yardan  cayacak, hep  köşe  bucak

Başar Döner

A               Gm        A
Ben  bu dünyayı anlayamadım
A                      Gm         A
Niyetlendim de altından kalkamadım

Nakarat
`,
    bars: `
A | Dm
Geldim  yarım kaldım  yarım
A | Dm
Neydi  ne oldu  şu  tez  canım
A# | Gm
Ertelendim hayattan  sevdim  yarım
A
Derken  bugün  olmasa  olur yarın

A
Kendinden kaçak
A | Dm
Yarim  keskin  bıçak
F | C
Nerde  bende  o yürek
A# | A | A# | A
Yardan  cayacak, hep  köşe  bucak


A | Gm | A
Ben  bu dünyayı anlayamadım
A | Gm | A
Niyetlendim de altından kalkamadım
`,
    arrangement: `
Verse x2: A | % | Dm | %
          A | % | Dm | %
          A# | % | Gm | %
          Gm | % | A
Chorus: |: A | % | % | Dm
        F | C | A# | A :|   x2
        A# | A
Bridge: A | % | Gm | A   x2

order: Verse, Chorus, Verse, Chorus, Bridge, Chorus
`
  },
  {
    id: "oyku-gurman-seni-ben-unutmak-istemedim-ki",
    title: "Seni Ben Unutmak İstemedim ki",
    artist: "Öykü Gürman",
    key: "C",
    source: "https://akorlar.com/oyku-gurman-seni-ben-unutmak-istemedimki",
    video: "https://www.youtube.com/watch?v=d5A_OOmVdP4",
    format: "over",
    body: `
C                Db        C
Seni Ben Unutmak İstemedim ki
          A#m              Fm
Uzayan Yollara Neden İnandın
                   Db        C
Sevenler Verdiği Sözden Döner mi
            Db   A#m        C
Şu Yalan Yollara Neden İnandın
Fm                Db         C
Sevenler Verdiği Sözden Döner mi
  Db   A#m        C    C Db Fm
Şu Yalan Yollara Neden İnandın

          Fm                  C
Seni Unutsaydım Beklermiydim Hiç
                                  Fm
Bir Derdime Bin Dert Eklermiydim Hiç
Db                 F        A#m
Şu Sonsuz Hasreti Kalbime Koyup
         Db        A#m           C
Bir Ömür Boyu Ahhh Çekermiydim Hiç

C Db G#

G#                 F        A#m
Bana Sen Uzaktan Sitem Ettikçe
D#               G#
Benim Umutlarım Elimden Tutmaz
                 Fm       C
O Yalan Sözlere Sakın İnanma
           Db    A#m       C
Seneler Geçse de Seven Unutmaz
`,
    arrangement: `
Verse: C | Db | C | A#m | Fm | Db | C | Db | A#m | C | Fm | Db | C | Db | A#m | C | % | Db | Fm
Chorus: Fm | C | Fm | Db | F | A#m | Db | A#m | C
Ara: C | Db | G#
Bridge: G# | F | A#m | D# | G# | Fm | C | Db | A#m | C

order: Verse, Chorus, Ara, Bridge
`
  },
  {
    id: "tarik-menguc-sak-suka",
    title: "Şak Şuka",
    artist: "Tarık Mengüç",
    key: "B",
    source: "https://akorlar.com/tarik-menguc-saksuka",
    video: "https://www.youtube.com/watch?v=laF_VdHN8G8",
    format: "over",
    body: `
Am               B
Yine bana tadını tattıramadın
Am             B
Yine kalamadık başbaşa
Am            B
Ayarını canım tutturamadın
Am          B
Yediremedin şakşuka

B       C      Am            B
Şakşuka şakşuka şakşuka şaka da şuka
B            C           Am               B
Doyamadığım, tadamadığım, yiyemediğim şaka da şuka

Am           B
Tarif edeyim öğreteyim sana
Am           B
Hoşuna gider şakşuka
Am            B
Canım istiyor getir de yiyeyim
Am           B
Doyayım hadi tıkabasa
`,
    arrangement: `
Verse: Am | B | Am | B | Am | B | Am | B
Chorus: B | C | Am | B | % | C | Am | B

order: Verse, Chorus, Verse
`
  },
  {
    id: "neset-ertas-zuluf-dokulmus-yuze",
    title: "Zülüf Dökülmüş Yüze",
    artist: "Neşet Ertaş",
    key: "C",
    source: "https://akorlar.com/neset-ertas-zuluf-dokulmus-yuze",
    video: "https://www.youtube.com/watch?v=PzYwRlCLcVc",
    format: "over",
    body: `
C                   D                  F
Zülüf dökülmüş yüze aman,
C           A#m                 Fm
Kaşlar yakışmış göze aman aman.
D sus4            C                Fm
Usandım bu canımdan aman aman,
C       Fm   Db   C
Dert ile geze geze.

A#m  Db  C

C                  D               F
Bu ellerde gez gayrı aman,
C        A#m    C                Fm
Kâtip ol da yaz gayrı aman aman.
D sus4            C                Fm
Bir kazma al bir kürek aman aman,
C       Fm   Db     C
Mezarımı kaz gayrı.

A#m  Db  C
`,
    arrangement: `
Verse: C | D | F | C | A#m | Fm | C | Fm | Db | C
Ara: A#m | Db | C
Chorus: C | D | F | C | A#m | C | Fm | C | Fm | Db | C

order: Verse, Ara, Chorus, Ara
`
  },
  {
    id: "ajda-pekkan-olanlar-oldu-bana",
    title: "Olanlar Oldu Bana",
    artist: "Ajda Pekkan",
    key: "C#",
    source: "https://e-akor.com/sarki/ajda-pekkan-olanlar-oldu-bana-akor/fd",
    video: "https://www.youtube.com/watch?v=xZHwPFsThL4",
    format: "over",
    body: `
F#m  C#m  F#m  C#m
Kendim anladım kimselere soramadım
D  E  D  C#m
Onu bulup sormak ister canım
F#m  C#m  F#m  C#m
Çare aradım aşkına doyamadım
D  E  D  C#
Seni bulup kaçmak ister canım

D
Hayırsız ama düştüm ağına
E  D  C#m
Olanlar oldu bana
D
Yalancı amma tadı da başka
E  D  C#
Olanlar oldu bana

F#m  E
Zalim bilmiyor sabah olmuyor
D  E  C#
Derdim bitmiyor ah
F#  E
Taştan mı sandın beni
D  E  C#
Ey(sen) Tanrım garibim, aldandın  x2
`,
    arrangement: `
Chorus: F#m | E | D | C#   x4
Verse: F#m C#m | F#m C#m | D | E | C#   x2
Pre-Chorus: D | % | D C# | C#   x2

order: Chorus, Verse, Pre-Chorus, Chorus, Verse, Pre-Chorus, Chorus, Solo, Chorus
`
  },
  {
    id: "ajda-pekkan-sana-ne-kime-ne",
    title: "Sana Ne Kime Ne",
    artist: "Ajda Pekkan",
    key: "Bbm",
    source: "https://akormatik.com/pages/song/ajda-pekkan-sana-ne-kime-ne?transpose=-1",
    video: "https://www.youtube.com/watch?v=98plycP955Y",
    format: "over",
    body: `
F7  |  Bbm  |  F7  |  Bbm  x2

      Bbm          F7       F7         Bbm
Hiç rahat yok mu bana, şu yalancı dünyada
      Bbm          F7     F7        Bbm
Kimin ne hakkı var ki karışır hayatıma
    Ebm                   F7
Hesap soramaz bana, kim çıkarsa karşıma
      Bbm          F7     F7        Bbm
Kimin ne hakkı var ki karışır hayatıma

F7  |  Bbm

       F        Gb    F    Bbm  F   Gb   F   Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
     F     Gb   F    Bbm  Ab       Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
    Ebm    F          F
Zararım kendime, kime ne, kime ne?
        Ebm        F7       F7       Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7  |  Bbm  |  F7  |  Bbm

      Bbm         F7        F7       Bbm
Bu kalp benim değil mi, severim, severim
    Bbm         F7          F7    Bbm
Canım nasıl isterse, gezer, eğlenirim
      Ebm                     F7
Her günüm mutlu benim, kim ne derse desin
      Bbm        F7         F7    Bbm
Canım nasıl isterse, gezer, eğlenirim

F7  |  Bbm

       F        Gb    F    Bbm  F   Gb   F   Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
     F     Gb   F    Bbm  Ab       Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
    Ebm    F          F
Zararım kendime, kime ne, kime ne?
        Ebm        F7       F7       Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7  |  Bbm  |  F7  |  Bbm

       F        Gb    F    Bbm  F   Gb   F   Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
     F     Gb   F    Bbm  Ab       Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
    Ebm    F          F
Zararım kendime, kime ne, kime ne?
        Ebm        F7       F7       Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7  |  Bbm  |  F7  |  Bbm  x2
`,
    bars: `
F7 | Bbm | F7 | Bbm   x2

Bbm F7 F7 Bbm
Hiç rahat yok mu bana, şu yalancı dünyada
Bbm F7 F7 Bbm
Kimin ne hakkı var ki karışır hayatıma
Ebm F7
Hesap soramaz bana, kim çıkarsa karşıma
Bbm F7 F7 Bbm
Kimin ne hakkı var ki karışır hayatıma

F7 | Bbm

F Gb F Bbm F Gb F Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
F Gb F Bbm Ab Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
Ebm F F
Zararım kendime, kime ne, kime ne?
Ebm F7 F7 Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7 | Bbm | F7 | Bbm

Bbm F7 F7 Bbm
Bu kalp benim değil mi, severim, severim
Bbm F7 F7 Bbm
Canım nasıl isterse, gezer, eğlenirim
Ebm F7
Her günüm mutlu benim, kim ne derse desin
Bbm F7 F7 Bbm
Canım nasıl isterse, gezer, eğlenirim

F7 | Bbm

F Gb F Bbm F Gb F Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
F Gb F Bbm Ab Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
Ebm F F
Zararım kendime, kime ne, kime ne?
Ebm F7 F7 Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7 | Bbm | F7 | Bbm

F Gb F Bbm F Gb F Bbm
Hür doğdum, hür yaşa- rım, kime ne, kime ne? Köle
F Gb F Bbm Ab Dbmaj7 Fm7
Köle miyim sana ben, sana ne, sana ne?    Zara-
Ebm F F
Zararım kendime, kime ne, kime ne?
Ebm F7 F7 Bbm
Sen bak kendi derdine, sana ne, sana ne?

F7 | Bbm | F7 | Bbm   x2
`,
    arrangement: `
Intro: F7 | Bbm | F7 | Bbm   x2
Verse: Bbm F7 F7 Bbm | % | Ebm F7 | Bbm F7 F7 Bbm
Ara: F7 | Bbm
Chorus: F Gb F Bbm F Gb F Bbm | F Gb F Bbm Ab Dbmaj7 Fm7 | Ebm F F | Ebm F7 F7 Bbm

order: Intro, Verse, Ara, Chorus, Intro, Verse, Ara, Chorus, Intro, Chorus, Intro
`
  },
  {
    id: "ajda-pekkan-sana-dogru",
    title: "Sana Doğru",
    artist: "Ajda Pekkan",
    key: "Gm",
    source: "https://tabs.ultimate-guitar.com/tab/3338915",
    video: "https://www.youtube.com/watch?v=rVMvfs2qPfQ",
    format: "over",
    body: `
[Verse 1]
Gm                    D
  Herkes seçer kendi yolunu
D7                      Gm
  Bilmem ki mutsuzluk mu sonu
Ebmaj7                 Cm
  Şu günlük güneşlik dünyada
      D    D7
Bulur en zorunu

Gm                    D
  Herkes seçer kendi yolunu
D7                      Gm
  Bilmem ki mutsuzluk mu sonu
Ebmaj7                 Cm
  Şu günlük güneşlik dünyada
      D    D7
Bulur en zorunu

[Chorus 1]
        Gm         F
Benim yolumsa sana doğru
        Eb
Dolandı durdu
              Dm
Çıkmazmış bir sokakmış
           Gm
Meğer dönülmez oldu
      F         Eb
Dik yokuşlar uçurumlar
        D                   Gm
Anlaşmazlıklar pusu kurmuş önümde
       F                  Eb
Kurtar desem de sen vazgeçsen de
         D7
Dönüp gitsem de sevgi mahkum elinde

[Verse 2]
Gm                D
  Bizi güçlükler ayırsa da
D7              Gm
  Umudum var hala yarın da
Ebmaj7                Cm
  Ben severim aşkın zorunu
       D         D7
Kimi gider kolayına

[Chorus 2]
        Gm         F
Benim yolumsa sana doğru
        Eb
Dolandı durdu
              Dm
Çıkmazmış bir sokakmış
           Gm
Meğer dönülmez oldu
      F         Eb
Dik yokuşlar uçurumlar
        D                   Gm
Anlaşmazlıklar pusu kurmuş önümde
       F                  Eb
Kurtar desem de sen vazgeçsen den
         D7
Dönüp gitsem de sevgi mahkum elinde

[Outro]
Gm
`,
    arrangement: `
Verse: Gm | D | D7 | Gm
       Ebmaj7 | Cm | D | D7
Chorus: Gm | F | Eb | D7   x4

order: Verse x2, Chorus, Verse, Chorus x3
`
  },
  {
    id: "belkis-ozener-benim-gozum-sende",
    title: "Benim Gözüm Sende",
    artist: "Belkıs Özener",
    key: "Dm",
    source: "https://www.gitaregitim.net/benim-gozum-sende-nota-tab/",
    video: "https://www.youtube.com/watch?v=ahXU1nJTwig",
    format: "over",
    body: `
[Intro]
Gm  |  F  |  Eb  |  D  x2

Dm       Dm         Dm         Gm
Görünce aşık oldum, o güzel gözlerine
Cm        Eb       F (ara)  Dm
Başkasını istemem, benim gözüm sende
`,
    bars: `
[Intro]
Gm | F | Eb | D   x2

Dm | Dm | Dm | Gm
Görünce aşık oldum, o güzel gözlerine
Cm | Eb | F | Dm
Başkasını istemem, benim gözüm sende
`,
    arrangement: `
Chorus: Gm | F | Eb | D   x4
Verse x2: Dm | % | % | Gm
          Cm | Eb | (F) | Dm

order: Chorus, Verse, Chorus, Verse, Chorus, Verse, Chorus
`
  },
  {
    id: "nadide-sultan-konyalim",
    title: "Konyalım",
    artist: "Nadide Sultan",
    key: "Cm",
    video: "https://www.youtube.com/watch?v=6qP1jD4hkEo",
    format: "over",
    body: `
Hani ya da benim elli dirhem pırasam
Üç mum yaksam konyalıyı arasam

Konyalım yürü yürü yavrum yürü fistanını sürü
Şimdi de geçti de burdan konyalının biri

Hani ya da benim elli dirhem yoğurdum
Konyalıdan ben bir roman doğurdum

Konyalım yürü yürü yavrum yürü fistanını sürü
Şimdi de geçti de burdan konyalının biri


Hani ya da benim elli dirhem bulgurum
Konyalının kaşlarına vurgunum

Konyalım yürü yürü yavrum yürü fistanını sürü
Şimdi de geçti de burdan konyalının biri

Hani ya da benim elli dirhem pastırmam
Konyalıdan başkasına bastırmam

Konyalım yürü yürü yavrum yürü fistanını sürü
Şimdi de geçti de burdan konyalının biri
`,
    arrangement: `
Verse: Cm | % | % | % | Cm Fm Cm Fm
Pre-Chorus: Cm Fm | Bb | Eb Fm
Chorus: Cm Bb | Eb F   x4

order: Intro, Verse, Pre-Chorus, Chorus, Intro, Verse, Pre-Chorus, Chorus, Solo, Verse, Pre-Chorus, Chorus, Intro, Verse, Pre-Chorus, Chorus
`
  }
];
