'use client';

import React, { useState, useMemo, CSSProperties } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface RulesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

type TabType = 'phases' | 'town' | 'mafia' | 'neutral' | 'court';

interface RoleRule {
  readonly id: string;
  readonly title: string;
  readonly originalTitle: string;
  readonly faction: 'TOWN' | 'MAFIA' | 'NEUTRAL';
  readonly factionLabel: string;
  readonly badgeTone: 'neutral' | 'amber' | 'purple';
  readonly icon: string;
  readonly iconColor: string;
  readonly nightAbility: string;
  readonly dayAbility: string;
  readonly winCondition: string;
  readonly proTip: string;
}

const ROLES_DATABASE: readonly RoleRule[] = [
  // === ŞƏHƏR İTTİFAQI (TOWN) ===
  {
    id: 'investigator',
    title: 'Şərif / Komissar',
    originalTitle: 'Sheriff / Investigator',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-magnifying-glass',
    iconColor: '#38bdf8',
    nightAbility: 'Hər gecə 1 oyunçunun kimliyini gizli yoxlayır. Nəticədə hədəfin "Məsum Şəhərli" və ya "Şübhəli Mafioz" olduğunu öyrənir.',
    dayAbility: 'Gündüz məclisində deduksiya nəticələrini şəhərlilərlə bölüşərək əsl cinayətkarları ifşa etmək üçün ittiham irəli sürür.',
    winCondition: 'Şəhərdəki bütün Mafiya, Yakuza və Seriyalı Qatillər edam edildikdə şəhərlilərlə birgə qalib gəlir.',
    proTip: 'İlk gündən dərhal rolunuzu açıqlamayın, əks halda növbəti gecə Mafiyanın ilk hədəfi olacaqsınız. Şübhəli nəticə tapdıqdan sonra məhkəmədə danışın.',
  },
  {
    id: 'doctor',
    title: 'Həkim / Şəhər Cərrahı',
    originalTitle: 'Doctor / City Surgeon',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-user-doctor',
    iconColor: '#34d399',
    nightAbility: 'Hər gecə 1 oyunçunu seçərək onu qoruyur. Əgər Mafiya və ya Manyak həmin şəxsə hücum edərsə, hücum zərərsizləşdirilir və qurban sağ qalır.',
    dayAbility: 'Açıq səsvermədə digər vətəndaşlarla birgə səs verir.',
    winCondition: 'Bütün cinayətkar fraksiyalar aradan qaldırıldıqda Şəhər İttifaqı ilə birgə qalib gəlir.',
    proTip: 'Ardıcıl iki gecə eyni şəxsi qoruya bilməzsiniz. İfşa olmuş Şərifi və ya etibarlı oyunçuları qorumaq oyunun taleyini həll edir.',
  },
  {
    id: 'mayor',
    title: 'Bələdiyyə Sədri',
    originalTitle: 'Mayor',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-landmark',
    iconColor: '#fbbf24',
    nightAbility: 'Gecə xüsusi qabiliyyəti yoxdur (öz kabinetində təhlükəsizlikdədir).',
    dayAbility: 'İstənilən gündüz mərhələsində səlahiyyətini rəsmən elan edə bilər. Elan etdikdən sonra onun səsi 1 deyil, 3 səs (x3) gücündə sayılır!',
    winCondition: 'Şəhər daxilindəki bütün xainlər məhv edildikdə.',
    proTip: 'Səlahiyyətinizi yalnız kritik məqamda (bərabərlik və ya həlledici səsvermə zamanı) elan edin, çünki elandan sonra Həkim sizi gecə qoruya bilməyə bilər.',
  },
  {
    id: 'coroner',
    title: 'Məhkəmə Eksperti',
    originalTitle: 'Coroner / Medical Examiner',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-microscope',
    iconColor: '#a78bfa',
    nightAbility: 'Ölən oyunçulardan birinin cəsədini araşdırır. Qətlin hansı silahla törədildiyini və qurbanın son gecə kimlərlə təmasda olduğunu aşkarlayır.',
    dayAbility: 'Ekspertiza rəyini məhkəməyə təqdim edərək yalançı bəyanatları darmadağın edir.',
    winCondition: 'Şəhər İttifaqının tam qələbəsi.',
    proTip: 'Qətlin Mafiya, yoxsa Neytral Qatil tərəfindən törədildiyini ayırd etməklə şəhərdə neçə müstəqil qatilin olduğunu dərhal üzə çıxara bilərsiniz.',
  },
  {
    id: 'martyr',
    title: 'Fədai / Məsum Şəhid',
    originalTitle: 'Martyr',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-shield-halved',
    iconColor: '#60a5fa',
    nightAbility: 'Hər gecə bir oyunçunu qorumaq üçün təyin edir. Həmin şəxsə ölümcül hücum edilərsə, Fədai zərbəni öz üzərinə götürür və qurbanın yerinə şəhid olur.',
    dayAbility: 'Vətəndaş hüququ ilə səsvermədə iştirak edir.',
    winCondition: 'Şəhər İttifaqının qələbəsi.',
    proTip: 'Ən dəyərli şəhər rollarını (Şərif və ya Cərrah) öz həyatınız bahasına xilas etmək şəhərə böyük üstünlük qazandırır.',
  },
  {
    id: 'investigator_deputy',
    title: 'Şəhər Müstəntiqi',
    originalTitle: 'City Investigator',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-fingerprint',
    iconColor: '#38bdf8',
    nightAbility: 'Hər gecə iki oyunçunu izləyir və onların eyni fraksiyaya aid olub-olmadığını öyrənir.',
    dayAbility: 'Əlaqələri ifşa edir.',
    winCondition: 'Bütün düşmən fraksiyaların təmizlənməsi.',
    proTip: 'Bir nəfərin məsumluğunu dəqiqləşdirdikdən sonra digər şübhəlini onunla müqayisə edin.',
  },
  {
    id: 'vanilla_town',
    title: 'Sıravi Vətəndaş',
    originalTitle: 'Citizen / Vanilla Town',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-users',
    iconColor: '#94a3b8',
    nightAbility: 'Gecə evində yatır, xüsusi gecə hərəkəti yoxdur.',
    dayAbility: 'Məhkəmədə və məclisdə tam səs hüququ ilə yalançıları tutmaq, arqumentləri dinləmək və kollektiv qərar vermək.',
    winCondition: 'Bütün cinayətkarlar edam edildikdə Şəhərlə birgə qalib gəlir.',
    proTip: 'Sıravi Vətəndaş oyunun ən güclü psixoloji roludur! Şərifin və Həkimin gizli qalması üçün diqqəti öz üzərinizə çəkə və Mafiyanı çaşdıra bilərsiniz.',
  },
  {
    id: 'bodyguard',
    title: 'Mühafizəçi / Cangüdən',
    originalTitle: 'Bodyguard',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-user-shield',
    iconColor: '#38bdf8',
    nightAbility: 'Hər gecə bir oyunçunu qoruyur. Həmin şəxsə ölümcül hücum edilərsə, Mühafizəçi qatillə duelə girir: həm hücum edən cinayətkarı zərərsizləşdirir, həm də qorunan şəxsi xilas edərək özü qəhrəmancasına həlak olur.',
    dayAbility: 'Məhkəmədə səsvermədə iştirak edir.',
    winCondition: 'Bütün cinayətkar fraksiyaların məhv edilməsi.',
    proTip: 'Şərifi və ya Bələdiyyə Sədrini qorumaqla bir gecədə Mafiyanın əsas qatilini tələyə salıb məhv edə bilərsiniz.',
  },
  {
    id: 'detective',
    title: 'Xəfiyyə / Şəhər İzləyicisi',
    originalTitle: 'Detective / Tracker',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-binoculars',
    iconColor: '#0ea5e9',
    nightAbility: 'Hər gecə bir oyunçunun evini gizlicə pusur. Həmin şəxsin gecə kimin evinə getdiyini (kimi ziyarət etdiyini) dəqiq qeydə alır.',
    dayAbility: 'Gecə ziyarət izlərini məhkəməyə təqdim edərək qətlin baş verdiyi evə kimin girdiyini ifşa edir.',
    winCondition: 'Şəhərin tam qələbəsi.',
    proTip: 'Ölən şəxsin evinə gedən adamı aşkar etsəniz, onun qatil və ya köməkçi olduğunu dərhal sübut edə bilərsiniz.',
  },
  {
    id: 'veteran',
    title: 'Qazi / Qisasçı Əsgər',
    originalTitle: 'Veteran',
    faction: 'TOWN',
    factionLabel: 'Şəhər İttifaqı',
    badgeTone: 'neutral',
    icon: 'fa-medal',
    iconColor: '#f59e0b',
    nightAbility: 'Oyunda cəmi 3 dəfə gecə "Döyüş Həyəcanı" elan edə bilər. Həyəcan gecəsi onun qapısını döyən HƏR KƏS (qatil, şərif, həkim fərqi qoyulmadan) güllələnir və dərhal öldürülür!',
    dayAbility: 'Gündüz məclisində şəhərliləri ayıq-sayıq olmağa çağırır.',
    winCondition: 'Bütün təhdidlərin aradan qaldırılması.',
    proTip: 'Gündüz məclisində özünüzü şübhəli və ya vacib hədəf kimi göstərib həmin gecə Həyəcan elan edin ki, Mafiya sizə hücum edərkən öz güllənizə tuş gəlsin.',
  },

  // === MAFİYA AilÉ™siI (MAFIA) ===
  {
    id: 'godfather',
    title: 'Don / Xaç Atası',
    originalTitle: 'Godfather / Don',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-crown',
    iconColor: '#ef4444',
    nightAbility: 'Gecə Mafiyanın qətl hədəfini təyin edir. Şərif onu yoxladıqda radar sistemi aldanır və Don "Məsum Vətəndaş" kimi görünür!',
    dayAbility: 'Özünü ən nümunəvi vətəndaş kimi göstərərək günahsız insanları ittiham hədəfinə çevirir.',
    winCondition: 'Mafiya şəhər əhalisi üzərində say üstünlüyü qazandıqda (paritet yarandıqda) qalib gəlir.',
    proTip: 'Şərif sizi yoxlasa belə "təmiz" çıxacaqsınız, buna görə də məclisdə inamla çıxış edib şəhərlilərin rəğbətini qazanın.',
  },
  {
    id: 'mafioso',
    title: 'Sıravi Mafioz / Cəllad',
    originalTitle: 'Mafioso / Enforcer',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-gun',
    iconColor: '#f87171',
    nightAbility: 'Donun verdiyi qətl əmrini birbaşa həyata keçirir. Əgər Don öldürülərsə, Mafioz avtomatik olaraq ailənin yeni Donuna çevrilir!',
    dayAbility: 'Məhkəmə səsverməsində şəhərlilərə qarşı birləşir.',
    winCondition: 'Şəhərin süqutu və Mafiyanın dominantlığı.',
    proTip: 'Donun təhlükəsizliyini təmin etmək üçün lazım gəldikdə şübhə oxlarını öz üzərinizə çəkin.',
  },
  {
    id: 'roleblocker',
    title: 'İllüziyaçı / Gözbağlayıcı',
    originalTitle: 'Consort / Roleblocker',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-wand-magic-sparkles',
    iconColor: '#fb923c',
    nightAbility: 'Hər gecə bir oyunçunu cazibəsi və ya tələsi ilə dondurur. Həmin oyunçunun gecə bacarığı bloklanır (Həkim qoruya bilmir, Şərif yoxlaya bilmir).',
    dayAbility: 'Şəhər müzakirələrində aktiv iştirak edir.',
    winCondition: 'Mafiyanın qələbəsi.',
    proTip: 'Həkimin və ya Şərifin kim olduğunu təxmin edən kimi hər gecə onu bloklayaraq Mafiya qətllərinin qarşısının alınmasına mane olun.',
  },
  {
    id: 'blackmailer',
    title: 'Paparassi / Şantajçı',
    originalTitle: 'Blackmailer',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-envelope-open-text',
    iconColor: '#f43f5e',
    nightAbility: 'Hər gecə bir oyunçunu şantaj edir. Şantaj olunan oyunçu növbəti gün məclisdə və məhkəmə çatında bir kəlmə belə yaza bilmir!',
    dayAbility: 'Susdurulmuş oyunçunu səsvermədə asanlıqla qurban verir.',
    winCondition: 'Mafiyanın qələbəsi.',
    proTip: 'Dünən gecə mühüm ipucu tapan Şərifi şantaj edin ki, məlumatı şəhərə açıqlaya bilməsin!',
  },
  {
    id: 'puppeteer',
    title: 'Kuklaçı',
    originalTitle: 'Puppeteer',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-mask',
    iconColor: '#dc2626',
    nightAbility: 'Hədəf seçdiyi oyunçunun gecə hərəkətini başqa bir iştirakçıya yönləndirir (məs: Həkimin qorumasını düşmənə, qatilin gülləsini qonşusuna çevirir).',
    dayAbility: 'Xaos mühitindən istifadə edir.',
    winCondition: 'Mafiyanın qələbəsi.',
    proTip: 'Qatilin gülləsini elə qatilin öz tərəfdaşına və ya ən güclü şəhərliyə yönəldərək gözlənilməz kombinasiyalar qurun.',
  },
  {
    id: 'framer',
    title: 'Şər Atan / Tələquran',
    originalTitle: 'Framer',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-file-signature',
    iconColor: '#fb923c',
    nightAbility: 'Hər gecə günahsız bir vətəndaşın üzərinə saxta dəlillər və cinayət silahı qoyur. Həmin gecə Şərif həmin şəxsi yoxlayarsa, sistem onu "Mafioz" olaraq göstərir!',
    dayAbility: 'Şərifin çaşqınlığından istifadə edərək günahsız şəxsin asılmasına təkan verir.',
    winCondition: 'Mafiyanın qələbəsi.',
    proTip: 'Şərifin şübhələndiyi günahsız vətəndaşlara şər atın ki, Şərif yoxlayıb onu cinayətkar sansın və şəhər öz məsum üzvünü edam etsin.',
  },
  {
    id: 'forger',
    title: 'Saxtakar Katib / Vəsiyyət Dəyişən',
    originalTitle: 'Forger',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    icon: 'fa-pen-nib',
    iconColor: '#e11d48',
    nightAbility: 'Mafiyanın qətlə yetirəcəyi şəxsin son vəsiyyətnaməsini və gündəliyini saxtalaşdırır. Səhər qəzetində həmin şəxsin əsl qeydləri deyil, Saxtakarın yazdığı yalançı ittihamlar dərc olunur.',
    dayAbility: 'Saxta qeydlər üzərindən şəhər daxilində qarşıdurma yaradır.',
    winCondition: 'Mafiyanın qələbəsi.',
    proTip: 'Şərif öldürülərkən onun son qeydlərini saxtalaşdırıb günahsız vətəndaşların adlarını "cinayətkar" kimi yazın!',
  },

  // === NEYTRAL VƏ XAOS ROLLARI (NEUTRALS) ===
  {
    id: 'jester',
    title: 'Dəli / Kloun',
    originalTitle: 'Jester / Shadow of Lucifer',
    faction: 'NEUTRAL',
    factionLabel: 'Neytral / Xaos',
    badgeTone: 'purple',
    icon: 'fa-face-laugh-squint',
    iconColor: '#c084fc',
    nightAbility: 'Gecə heç kimi öldürmür; öz xaos ssenarisini hazırlayır.',
    dayAbility: 'Özünü qəsdən şübhəli, yalançı və ya çaşqın göstərərək Şəhər Məhkəməsi tərəfindən EDAM EDİLMƏYƏ çalışır!',
    winCondition: 'Əgər gündüz xalq səsverməsi ilə asılarsa (edam edilərsə), DƏRHAL TƏKBAŞINA QALİB GƏLİR! Üstəlik, ona "Edam" lehinə səs vermiş hakimlərdən birini növbəti gecə lənətləyərək məzara aparır!',
    proTip: 'Həddindən artıq açıq-aşkar mafiya kimi görünməyin, yoxsa hamı sizin Dəli olduğunuzu başa düşüb səs verməz. İncə yalanlarla şəhərliləri qıcıqlandırın.',
  },
  {
    id: 'serial_killer',
    title: 'Seriyalı Qatil / Manyak',
    originalTitle: 'Serial Killer',
    faction: 'NEUTRAL',
    factionLabel: 'Neytral Qatil',
    badgeTone: 'purple',
    icon: 'fa-skull',
    iconColor: '#e11d48',
    nightAbility: 'Hər gecə amansızcasına 1 oyunçunu qətlə yetirir. Gecə bıçaqlanmağa qarşı xüsusi polad zirehi var (Mafiyanın adi gülləsi onu öldürmür!).',
    dayAbility: 'Məhkəmədə günahsız şəhərli maskası taxır.',
    winCondition: 'Həm Mafiyanı, həm də Şəhəri təkbaşına məhv edib masada qalan sonuncu canlı şəxs olmaq.',
    proTip: 'Əvvəlcə Mafiyanı tapıb onların sayını azaldın, şəhər zəiflədikdən sonra son zərbəni vurun.',
  },
  {
    id: 'amnesiac',
    title: 'Kimlik Axtaran',
    originalTitle: 'Amnesiac',
    faction: 'NEUTRAL',
    factionLabel: 'Zərərsiz Neytral',
    badgeTone: 'purple',
    icon: 'fa-question',
    iconColor: '#93c5fd',
    nightAbility: 'Gecə məzarlığa daxil olaraq daha öncə öldürülmüş istənilən oyunçunun rolunu və fraksiyasını (Şərif, Həkim, Don və s.) mənimsəyir.',
    dayAbility: 'Rolunu seçdikdən sonra bütün şəhərə "Yeni bir şəxs həmin rolu xatırladı" bildirişi gedir.',
    winCondition: 'Mənimsədiyi yeni fraksiyanın qələbə şərtləri onun şərtinə çevrilir.',
    proTip: 'Hansı tərəfin üstünlük qazandığını müşahidə edin və ən güclü fraksiyanın vəfat etmiş rolunu seçərək onların tərəfinə keçin.',
  },
  {
    id: 'yakuza',
    title: 'Yakuza Oyabun',
    originalTitle: 'Yakuza Clan',
    faction: 'NEUTRAL',
    factionLabel: 'Şərq Klanı',
    badgeTone: 'purple',
    icon: 'fa-dragon',
    iconColor: '#eab308',
    nightAbility: 'Qərb Mafiyasından asılı olmayan gizli gecə zərbələri endirir və öz klanını genişləndirir.',
    dayAbility: 'İki cəbhə arasında nifaq salır.',
    winCondition: 'Həm İtalyan Mafiyasını, həm də Şəhər İttifaqını sıradan çıxarmaq.',
    proTip: 'Şəhərliləri Mafiyaya qarşı qaldırın, Mafiya təmizləndikdən sonra zəifləmiş şəhəri ələ keçirin.',
  },
  {
    id: 'void_cultist',
    title: 'Boşluq Təriqətçisi',
    originalTitle: 'Void Cultist',
    faction: 'NEUTRAL',
    factionLabel: 'Mistik Təriqət',
    badgeTone: 'purple',
    icon: 'fa-eye',
    iconColor: '#a855f7',
    nightAbility: 'Hər gecə bir oyunçunu ayin üçün işarələyir. 3 oyunçu işarələndikdə qaranlıq portal açılır.',
    dayAbility: 'Təriqət ayinlərini gizlədir.',
    winCondition: 'Ayini tamamlayaraq bütün şəhəri qaranlığa qərq etmək.',
    proTip: 'Şübhə çəkməmək üçün hər iki cəbhənin sakit üzvlərini işarələyin.',
  },
  {
    id: 'arsonist',
    title: 'Yandırıcı / Qisasçı Pirotexnik',
    originalTitle: 'Arsonist',
    faction: 'NEUTRAL',
    factionLabel: 'Neytral Xaos',
    badgeTone: 'purple',
    icon: 'fa-fire-flame-curved',
    iconColor: '#f97316',
    nightAbility: 'Hər gecə bir oyunçunun evinə gizlicə benzin tökür (hədəf bundan xəbər tutmur). İstədiyi gecə isə kükürd yandıraraq daha əvvəl benzin tökdüyü BÜTÜN evləri eyni anda alova bürüyür və hamısını məhv edir!',
    dayAbility: 'Məhkəmədə tamamilə bitərəf mövqe sərgiləyir.',
    winCondition: 'Bütün digər oyunçuları yandıraraq şəhərdə sağ qalan yeganə şəxs olmaq.',
    proTip: 'Bir neçə gecə səbirlə həm Mafiyanın, həm də Şəhərin əsas simalarını benzinləyin, sonra tək bir gecədə kütləvi yanğın törədərək oyunu dərhal bitirin.',
  },
  {
    id: 'witch',
    title: 'Cadugər / Ruh İdarəçisi',
    originalTitle: 'Witch / Occultist',
    faction: 'NEUTRAL',
    factionLabel: 'Neytral / Xaos',
    badgeTone: 'purple',
    icon: 'fa-wand-sparkles',
    iconColor: '#ec4899',
    nightAbility: 'Hər gecə bir oyunçunu hipnoz edərək onun iradəsini ələ keçirir və həmin şəxsi istədiyi ikinci bir oyunçunun üzərinə yönəldir (məs: Qatili məcbur edir ki, öz mafioz dostunu öldürsün).',
    dayAbility: 'İttihamları manipulyasiya edir.',
    winCondition: 'Şəhər İttifaqının tamamilə məhv olması (Mafiya və ya Manyakla birgə sağ qalmaq kifayətdir).',
    proTip: 'Qatili tapdığınız an onu idarə edərək hər gecə şəhərin ən güclü simalarını onun əli ilə aradan qaldırın.',
  },
];

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('phases');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRoles = useMemo(() => {
    let list = ROLES_DATABASE;
    if (activeTab === 'town') list = list.filter((r) => r.faction === 'TOWN');
    if (activeTab === 'mafia') list = list.filter((r) => r.faction === 'MAFIA');
    if (activeTab === 'neutral') list = list.filter((r) => r.faction === 'NEUTRAL');

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.originalTitle.toLowerCase().includes(q) ||
        r.nightAbility.toLowerCase().includes(q) ||
        r.winCondition.toLowerCase().includes(q)
    );
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '16px',
  };

  const modalStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    borderRadius: '20px',
    padding: '24px 28px',
    maxWidth: '820px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.3), 0 0 60px rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  };

  const tabBtnStyle = (tab: TabType): CSSProperties => {
    const isActive = activeTab === tab;
    return {
      padding: '8px 16px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: 700,
      cursor: 'pointer',
      border: isActive ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
      color: isActive ? '#fca5a5' : '#94a3b8',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    };
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>📖</span>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: 900 }}>
                TDV MAFIA - Oyun Qaydaları və 24 Rol Ensiklopediyası
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Məktəb icması üçün peşəkar sosial deduksiya, məhkəmə və gecə əməliyyatları protokolları
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '6px 12px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
          <button type="button" onClick={() => setActiveTab('phases')} style={tabBtnStyle('phases')}>
            <i className="fa-solid fa-clock-rotate-left" />
            <span>📜 Oyun Fazaları</span>
          </button>
          <button type="button" onClick={() => setActiveTab('town')} style={tabBtnStyle('town')}>
            <i className="fa-solid fa-shield-halved" />
            <span>🛡️ Şəhər (10 Rol)</span>
          </button>
          <button type="button" onClick={() => setActiveTab('mafia')} style={tabBtnStyle('mafia')}>
            <i className="fa-solid fa-gun" />
            <span>🩸 Mafiya (7 Rol)</span>
          </button>
          <button type="button" onClick={() => setActiveTab('neutral')} style={tabBtnStyle('neutral')}>
            <i className="fa-solid fa-dice-d20" />
            <span>🎭 Neytral & Xaos (7 Rol)</span>
          </button>
          <button type="button" onClick={() => setActiveTab('court')} style={tabBtnStyle('court')}>
            <i className="fa-solid fa-gavel" />
            <span>⚖️ Məhkəmə & Edam</span>
          </button>
        </div>

        {/* Search for roles when browsing roles tabs */}
        {activeTab !== 'phases' && activeTab !== 'court' && (
          <div style={{ position: 'relative' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}
            />
            <input
              type="text"
              placeholder="Rolu adına və ya bacarığına görə axtarın (məs: Şərif, Həkim, Don, Dəli, Şantaj)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '10px 14px 10px 38px',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Tab 1: Phases Loop & 75s Protocol */}
        {activeTab === 'phases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#38bdf8' }}>1.</span> Mərhələlər Dövrü (Day & Night Phase Loop)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderLeft: '3px solid #38bdf8' }}>
                  <strong style={{ color: '#38bdf8' }}>☀️ Gündüz Regional Məclis (Müzakirə Fazası):</strong> Bütün oyunçular açıq çatda arqumentlər irəli sürür, dünən gecə baş verən qətlləri müzakirə edir və şübhəliləri müəyyən edir.
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b' }}>
                  <strong style={{ color: '#f59e0b' }}>⚖️ Ümumşəhər Məhkəməsi (Səsvermə Fazası):</strong> İttiham olunan şəxs kürsüyə çıxır. Oyunçular &quot;Edam&quot;, &quot;Bəraət&quot; və ya &quot;Bitərəf&quot; səs verir. Mütləq səs çoxluğu toplanarsa, şəxs edam olunur və kimliyi Səhər Qəzetində elan edilir.
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #ef4444' }}>
                  <strong style={{ color: '#ef4444' }}>🌙 Qaranlıq Gecə (Gizli Əməliyyatlar):</strong> Şəhər yatır! Mafiya qətl hədəfini seçir, Həkim mühafizə edir, Şərif təhqiqat aparır. Əmrlər şifrələnərək qeydə alınır.
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: 800 }}>
                  2. 75 Saniyəlik Gemini AI Qoruma Protokolu
                </h3>
                <Badge tone="purple">AI Mühafizə</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
                Əgər hər hansı oyunçunun interneti kəsilərsə və ya pəncərəni bağlayarsa, dərhal <strong>75 saniyəlik taymer</strong> işə düşür. Bu müddətdə geri qayıtmazsa, masa POZULMUR! Gemini 3.8 Flash modeli həmin oyunçunun roluna və fraksiyasına uyğun şəkildə masanı tərk etmədən oyunu davam etdirir. Oyunçu geri qayıtdıqda idarəetmə dərhal insana qaytarılır.
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Court & Execution Rules */}
        {activeTab === 'court' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1' }}>
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '16px', fontWeight: 800 }}>
                ⚖️ Məhkəmə və Edam Qaydaları
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong style={{ color: '#f8fafc' }}>Mütləq Səs Çoxluğu:</strong> Bir nəfərin edam olunması üçün canlı vətəndaşların ümumi sayının 50%-dən çoxu (&gt;N/2) həmin şəxsə səs verməlidir.
                </li>
                <li>
                  <strong style={{ color: '#f8fafc' }}>30 Saniyəlik Son Söz (Müdafiə):</strong> Kürsüyə çıxarılan şübhəliyə səsvermədən dərhal əvvəl 30 saniyəlik son müdafiə hüququ verilir. Bu müddətdə başqaları danışa bilməz.
                </li>
                <li>
                  <strong style={{ color: '#f8fafc' }}>Bərabərlik Halı:</strong> Əgər səsvermədə bərabərlik yaranarsa, həmin gün heç kim edam edilmir və şəhər qaranlıq gecəyə qədəm qoyur.
                </li>
                <li>
                  <strong style={{ color: '#f8fafc' }}>Kokit Gölü (Dante 9) Gizli Səsverməsi:</strong> Xüsusi dəhşət rejimində kimin kimə səs verdiyi gizli saxlanılır; yalnız yekun hökm açıqlanır.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Roles Tabs (Town, Mafia, Neutral) */}
        {(activeTab === 'town' || activeTab === 'mafia' || activeTab === 'neutral') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                }}
              >
                {/* Role Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: role.iconColor,
                        fontSize: '16px',
                        border: `1px solid ${role.iconColor}40`,
                      }}
                    >
                      <i className={`fa-solid ${role.icon}`} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{role.title}</h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{role.originalTitle}</span>
                    </div>
                  </div>
                  <Badge tone={role.badgeTone}>{role.factionLabel}</Badge>
                </div>

                {/* Abilities */}
                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>🌙 Gecə Bacarığı: </strong>
                    <span style={{ color: '#cbd5e1' }}>{role.nightAbility}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#fbbf24' }}>☀️ Gündüz Rolu: </strong>
                    <span style={{ color: '#cbd5e1' }}>{role.dayAbility}</span>
                  </div>
                  <div>
                    <strong style={{ color: '#34d399' }}>🏆 Qələbə Şərti: </strong>
                    <span style={{ color: '#cbd5e1' }}>{role.winCondition}</span>
                  </div>
                </div>

                {/* Pro Tip */}
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.06)',
                    border: '1px dashed rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: '#fca5a5',
                  }}
                >
                  <strong>💡 Peşəkar Taktika: </strong>
                  {role.proTip}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Cəmi 18 Əsas Rol • 14 Oyun Formatı • TDV Community Labs Standartı
          </span>
          <Button variant="primary" size="md" onClick={onClose} style={{ padding: '8px 24px' }}>
            Başa Düşdüm, Masaya Qayıt
          </Button>
        </div>
      </div>
    </div>
  );
};