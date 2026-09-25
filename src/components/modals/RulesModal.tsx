'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Shield,
  Crosshair,
  Sparkles,
  Gavel,
  Clock,
  Search,
  X,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Users,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { playCard } from '../../utils/sfx';

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
  readonly iconName: string;
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
    iconName: 'fa-magnifying-glass',
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
    iconName: 'fa-user-doctor',
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
    iconName: 'fa-landmark',
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
    iconName: 'fa-microscope',
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
    iconName: 'fa-shield-halved',
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
    iconName: 'fa-fingerprint',
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
    iconName: 'fa-users',
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
    iconName: 'fa-user-shield',
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
    iconName: 'fa-binoculars',
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
    iconName: 'fa-medal',
    iconColor: '#f59e0b',
    nightAbility: 'Oyunda cəmi 3 dəfə gecə "Döyüş Həyəcanı" elan edə bilər. Həyəcan gecəsi onun qapısını döyən HƏR KƏS (qatil, şərif, həkim fərqi qoyulmadan) güllələnir və dərhal öldürülür!',
    dayAbility: 'Gündüz məclisində şəhərliləri ayıq-sayıq olmağa çağırır.',
    winCondition: 'Bütün təhdidlərin aradan qaldırılması.',
    proTip: 'Gündüz məclisində özünüzü şübhəli və ya vacib hədəf kimi göstərib həmin gecə Həyəcan elan edin ki, Mafiya sizə hücum edərkən öz güllənizə tuş gəlsin.',
  },

  // === MAFİYA AİLƏSİ (MAFIA) ===
  {
    id: 'godfather',
    title: 'Don / Xaç Atası',
    originalTitle: 'Godfather / Don',
    faction: 'MAFIA',
    factionLabel: 'Mafiya Ailəsi',
    badgeTone: 'amber',
    iconName: 'fa-crown',
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
    iconName: 'fa-gun',
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
    iconName: 'fa-wand-magic-sparkles',
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
    iconName: 'fa-envelope-open-text',
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
    iconName: 'fa-mask',
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
    iconName: 'fa-file-signature',
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
    iconName: 'fa-pen-nib',
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
    iconName: 'fa-face-laugh-squint',
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
    iconName: 'fa-skull',
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
    iconName: 'fa-question',
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
    iconName: 'fa-dragon',
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
    iconName: 'fa-eye',
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
    iconName: 'fa-fire-flame-curved',
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
    iconName: 'fa-wand-sparkles',
    iconColor: '#ec4899',
    nightAbility: 'Hər gecə bir oyunçunu hipnoz edərək onun iradəsini ələ keçirir və həmin şəxsi istədiyi ikinci bir oyunçunun üzərinə yönəldir (məs: Qatili məcbur edir ki, öz mafioz dostunu öldürsün).',
    dayAbility: 'İttihamları manipulyasiya edir.',
    winCondition: 'Şəhər İttifaqının tamamilə məhv olması (Mafiya və ya Manyakla birgə sağ qalmaq kifayətdir).',
    proTip: 'Qatili tapdığınız an onu idarə edərək hər gecə şəhərin ən güclü simalarını onun əli ilə aradan qaldırın.',
  },
];

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('town');
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

  const handleTabChange = (tab: TabType) => {
    playCard();
    setActiveTab(tab);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-[20px] ring-1 ring-white/10 shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-[90vh] max-h-[850px] overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── FIXED TOP HEADER BAR (ZERO SCROLL, NEVER SQUEEZED) ───── */}
        <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          
          {/* Row 1: Brand Title & Modal Controls */}
          <div className="p-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white leading-tight truncate">
                    TDV MAFIA — Qaydalar və 24 Rol Ensiklopediyası
                  </h2>
                  <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    24 Rol
                  </span>
                  <span className="hidden md:inline-flex text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    15 Rejim
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Məktəb icması üçün peşəkar sosial deduksiya, məhkəmə və gecə əməliyyatları protokolları
                </p>
              </div>
            </div>

            <button type="button" onClick={onClose} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
          </div>

          {/* Row 2: Navigation Tabs & Search Controls */}
          <div className="px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Elegant Segmented Tab Pills */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/90 border border-zinc-300/60 dark:border-zinc-700/60 gap-1 overflow-x-auto max-w-full">
              
              <button
                type="button"
                onClick={() => handleTabChange('phases')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeTab === 'phases'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Oyun Fazaları</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('town')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeTab === 'town'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Şəhər (10 Rol)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('mafia')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeTab === 'mafia'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Mafiya (7 Rol)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('neutral')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeTab === 'neutral'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Neytral & Xaos (7 Rol)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('court')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeTab === 'court'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Gavel className="w-3.5 h-3.5" />
                <span>Məhkəmə & Edam</span>
              </button>
            </div>

            {/* Quick Role Search Input */}
            {activeTab !== 'phases' && activeTab !== 'court' && (
              <div className="relative w-full md:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rol axtar (Şərif, Həkim, Don...)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── SCROLLABLE CONTENT BODY ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Tab 1: Phases Loop */}
          {activeTab === 'phases' && (
            <div className="flex flex-col gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-3">
                <h3 className="font-extrabold text-base text-zinc-950 dark:text-white flex items-center gap-2">
                  <span className="text-red-500">1.</span> Mərhələlər Dövrü (Day & Night Loop)
                </h3>
                <div className="flex flex-col gap-3 mt-1">
                  <div className="p-3.5 rounded-xl border-l-4 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10">
                    <strong className="text-zinc-900 dark:text-zinc-100">☀️ Gündüz Regional Məclis (Müzakirə Fazası):</strong> Bütün oyunçular açıq çatda arqumentlər irəli sürür, dünən gecə baş verən hadisələri təhlil edir və şübhəliləri müəyyənləşdirir.
                  </div>
                  <div className="p-3.5 rounded-xl border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10">
                    <strong className="text-zinc-900 dark:text-zinc-100">⚖️ Ümumşəhər Məhkəməsi (Səsvermə Fazası):</strong> İttiham olunan şəxs kürsüyə çıxır. Oyunçular &quot;Edam&quot;, &quot;Bəraət&quot; və ya &quot;Bitərəf&quot; səs verir. Mütləq səs çoxluğu toplanarsa şəxs edam olunur.
                  </div>
                  <div className="p-3.5 rounded-xl border-l-4 border-red-500 bg-red-500/5 dark:bg-red-500/10">
                    <strong className="text-zinc-900 dark:text-zinc-100">🌙 Qaranlıq Gecə (Gizli Əməliyyatlar):</strong> Şəhər yatır! Mafiya hədəf seçir, Həkim mühafizə edir, Şərif təhqiqat aparır. Əmrlər şifrələnərək qeydə alınır.
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-zinc-950 dark:text-white">
                    2. 75 Saniyəlik Gemini AI Qoruma Protokolu
                  </h3>
                  <Badge tone="purple">AI Mühafizə</Badge>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
                  Əgər oyunçulardan birinin bağlantısı qırılarsa, masa dağılmır! 75 saniyəlik qoruyucu bufer işə düşür və Gemini 3.8 modeli həmin oyunçunun roluna uyğun optimal qərarlar qəbul edərək oyunu fasiləsiz davam etdirir.
                </p>
              </div>
            </div>
          )}

          {/* Tab 5: Court Rules */}
          {activeTab === 'court' && (
            <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4">
              <h3 className="font-extrabold text-base text-zinc-950 dark:text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-red-500" />
                <span>Məhkəmə və Edam Qaydaları</span>
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-zinc-900 dark:text-zinc-100">Mütləq Səs Çoxluğu:</strong> Bir nəfərin edam olunması üçün canlı vətəndaşların ümumi sayının 50%-dən çoxu (&gt;N/2) həmin şəxsə səs verməlidir.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-zinc-100">30 Saniyəlik Son Söz (Müdafiə):</strong> Kürsüyə çıxarılan şübhəliyə səsvermədən dərhal əvvəl 30 saniyəlik son müdafiə hüququ verilir.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-zinc-100">Bərabərlik Halı:</strong> Əgər səsvermədə bərabərlik yaranarsa, həmin gün heç kim edam edilmir və şəhər qaranlıq gecəyə qədəm qoyur.
                </li>
                <li>
                  <strong className="text-zinc-900 dark:text-zinc-100">Dante Kokit Gölü Gizli Səsverməsi:</strong> Xüsusi dəhşət rejimində kimin kimə səs verdiyi gizli saxlanılır; yalnız yekun hökm açıqlanır.
                </li>
              </ul>
            </div>
          )}

          {/* Roles Tabs (Town, Mafia, Neutral) */}
          {(activeTab === 'town' || activeTab === 'mafia' || activeTab === 'neutral') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between gap-3 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-sm font-bold border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <i className={`fa-solid ${role.iconName}`} style={{ color: role.iconColor }} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-zinc-950 dark:text-white leading-tight">
                            {role.title}
                          </h4>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {role.originalTitle}
                          </span>
                        </div>
                      </div>
                      <Badge tone={role.badgeTone}>{role.factionLabel}</Badge>
                    </div>

                    <div className="space-y-1.5 text-xs pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div>
                        <strong className="text-blue-600 dark:text-blue-400">🌙 Gecə: </strong>
                        <span className="text-zinc-600 dark:text-zinc-300">{role.nightAbility}</span>
                      </div>
                      <div>
                        <strong className="text-amber-600 dark:text-amber-400">☀️ Gündüz: </strong>
                        <span className="text-zinc-600 dark:text-zinc-300">{role.dayAbility}</span>
                      </div>
                      <div>
                        <strong className="text-emerald-600 dark:text-emerald-400">🏆 Qələbə: </strong>
                        <span className="text-zinc-600 dark:text-zinc-300">{role.winCondition}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span>
                      <strong>Taktika: </strong>
                      {role.proTip}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── FIXED FOOTER ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            24 Əsas Rol • 15 Oyun Formatı • TDV Standartı
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Başa Düşdüm
          </Button>
        </div>
      </div>
    </div>
  );
};