import { connect } from 'http2'

export default {
  testPlanTitle: {
    zh: '测试计划',
    en: 'Test Plan',
    ja: 'テスト計画',
    tr: 'Test Planı',
    hu: 'Tesztterv',
  },
  butCreatePlanTitle: {
    zh: '创建测试计划',
    en: 'Create Test Plan',
    ja: 'テスト計画を作成する',
    tr: 'Test Planı Oluştur',
    hu: 'Tesztterv létrehozása',
  },
  name: {
    zh: '名称',
    en: 'Name',
    ja: '名前',
    tr: 'Ad',
    hu: 'Név',
  },
  id: {
    zh: 'ID',
    en: 'ID',
    ja: 'ID',
    tr: 'ID',
    hu: 'ID',
  },
  head_name: {
    zh: '名称(编辑)',
    en: 'Name (Edit)',
    ja: '名前（編集）',
    tr: 'Ad (Düzenle)',
    hu: 'Név (Szerkesztés)',
  },
  head_send_payload: {
    zh: '发送(编辑)',
    en: 'Send (Edit)',
    ja: '送信（編集）',
    tr: 'Gönder (Düzenle)',
    hu: 'Küldés (Szerkesztés)',
  },
  head_expect_payload: {
    zh: '预期(编辑)',
    en: 'Expect (Edit)',
    ja: '期待（編集）',
    tr: 'Bekle (Düzenle)',
    hu: 'Várható (Szerkesztés)',
  },
  head_response_payload: {
    zh: '响应',
    en: 'Response',
    ja: 'レスポンス',
    tr: 'Yanıt',
    hu: 'Válasz',
  },
  head_result: {
    zh: '结果',
    en: 'Result',
    ja: '結果',
    tr: 'Sonuç',
    hu: 'Eredmény',
  },
  nameTip: {
    zh: '测试计划名称',
    en: 'Test Plan Name',
    ja: 'テスト計画名',
    tr: 'Test Plan Adı',
    hu: 'Tesztterv Neve',
  },
  select_connect: {
    zh: '选择连接',
    en: 'Select Connection',
    ja: '接続を選択',
    tr: 'Bağlantı Seç',
    hu: 'Kapcsolat Kiválasztása',
  },
  test_connect: {
    zh: '测试',
    en: 'Test',
    ja: 'テスト',
    tr: 'Test Et',
    hu: 'Teszt',
  },
  protocol_version: {
    zh: '协议版本',
    en: 'Protocol Version',
    ja: 'プロトコルバージョン',
    tr: 'Protokol Sürümü',
    hu: 'Protokoll Verzió',
  },
  payload_type: {
    zh: '载荷类型',
    en: 'Payload Type',
    ja: 'ペイロードタイプ',
    tr: 'Yük Türü',
    hu: 'Payload Típus',
  },
  protocol_v_tip: {
    zh: '面向协议测试，请填写协议版本',
    en: 'For protocol-oriented testing, please fill in the protocol version',
    ja: 'プロトコル指向のテストの場合は、プロトコルバージョンを入力してください',
    tr: 'Protokol odaklı test için lütfen protokol sürümünü doldurun',
    hu: 'Protokoll-orientált teszteléshez töltse ki a protokoll verziót',
  },
  create_persion: {
    zh: '创建人',
    en: 'Created By',
    ja: '作成者',
    tr: 'Oluşturan',
    hu: 'Készítette',
  },
  general: {
    zh: '基础',
    en: 'General',
    tr: 'Genel',
    ja: '一般',
    hu: 'Általános',
  },
  advanced: {
    zh: '高级',
    en: 'Advanced',
    tr: 'Gelişmiş',
    ja: '詳細',
    hu: 'Haladó',
  },
  resp_timeout: {
    zh: '响应超时',
    en: 'Response Timeout',
    ja: 'レスポンスタイムアウト',
    tr: 'Yanıt Zaman Aşımı',
    hu: 'Válasz Időtúllépés',
  },
  resp_timeout_tip: {
    zh: '响应超时时长，单位s，默认3s。测试case中若响应超过此设置，将会被认为失败',
    en: 'Response timeout duration, in seconds. Default is 3s. If the response exceeds this setting in the test case, it will be considered a failure',
    ja: 'レスポンスのタイムアウト期間（秒）。デフォルトは3秒です。テストケースでこの設定を超えると、失敗と見なされます',
    tr: "Yanıt zaman aşım süresi, saniye cinsinden. Varsayılan 3s'dir. Test durumunda yanıt bu ayarı aşıyorsa, başarısız kabul edilir",
    hu: 'Válasz időtúllépés időtartama másodpercben. Az alapértelmezett 3 másodperc. Ha a válasz túllépi ezt a beállítást a tesztesetben, akkor hibának tekintik',
  },
  retry_num: {
    zh: '重试次数',
    en: 'Retry Number',
    ja: '再試行回数',
    tr: 'Yeniden Deneme Sayısı',
    hu: 'Próbálkozások Száma',
  },
  retry_num_tip: {
    zh: '响应超时后重试的最大次数。默认值0（不重复）',
    en: 'Maximum number of retries after response timeout. Default value is 0 (no retries)',
    ja: 'レスポンスタイムアウト後の再試行の最大回数。デフォルト値は0（再試行なし）です',
    tr: 'Yanıt zaman aşımından sonra yeniden deneme maksimum sayısı. Varsayılan değer 0 (yeniden deneme yok)',
    hu: 'A válasz időtúllépése után az újrapróbálkozások maximális száma. Az alapértelmezett érték 0 (nincsenek újrapróbálkozások)',
  },
  add_case_row: {
    zh: '添加一行',
    en: 'Add a Row',
    ja: '行を追加',
    tr: 'Satır Ekle',
    hu: 'Sor Hozzáadása',
  },
  new_tab_name: {
    zh: '新分组',
    en: 'New Group',
    ja: '新しいグループ',
    tr: 'Yeni Grup',
    hu: 'Új Csoport',
  },
  sys_error: {
    zh: '系统异常',
    en: 'System Error',
    ja: 'システムエラー',
    tr: 'Sistem Hatası',
    hu: 'Rendszerhiba',
  },
  create_case_group_successed: {
    zh: '创建分组成功',
    en: 'Group Created Successfully',
    ja: 'グループが正常に作成されました',
    tr: 'Grup Başarıyla Oluşturuldu',
    hu: 'Csoport sikeresen létrehozva',
  },
  delete_case_group_successed: {
    zh: '删除分组成功',
    en: 'Group Deleted Successfully',
    ja: 'グループが正常に削除されました',
    tr: 'Grup Başarıyla Silindi',
    hu: 'Csoport sikeresen törölve',
  },
  operation: {
    zh: '操作',
    en: 'Operation',
    ja: '操作',
    tr: 'İşlem',
    hu: 'Művelet',
  },
  edit_tab_tips: {
    zh: '* 双击带有编辑字样的列可进行编辑。选择要删除内容的单元格按Del按钮进行内容删除',
    en: '* Double-click on columns with the "Edit" label to edit. Select the cell with content to delete and press the "Delete" button',
    ja: '* 「編集」ラベルのついた列をダブルクリックして編集します。削除するコンテンツが含まれるセルを選択し、「削除」ボタンを押してください',
    tr: '* Düzenle etiketi bulunan sütunlara çift tıklayarak düzenleyin. Silmek istediğiniz içeriğe sahip hücreyi seçin ve "Sil" düğmesine basın',
    hu: '* Dupla kattintson a "Szerkesztés" feliratú oszlopokra a szerkesztéshez. Válassza ki a törlendő tartalmú cellát, majd nyomja meg a "Törlés" gombot',
  },
  save_case_successed: {
    zh: '保存测试用例成功',
    en: 'Test Case Saved Successfully',
    ja: 'テストケースが正常に保存されました',
    tr: 'Test Kapsamı Başarıyla Kaydedildi',
    hu: 'Teszteset sikeresen mentve',
  },
  createfailed_case: {
    zh: '创建测试用例失败',
    en: 'Failed to Create Test Case',
    ja: 'テストケースの作成に失敗しました',
    tr: 'Test Kapsamı Oluşturma Başarısız',
    hu: 'Teszteset létrehozása sikertelen',
  },
  delete_case_successed: {
    zh: '删除测试用例成功',
    en: 'Test Case Deleted Successfully',
    ja: 'テストケースが正常に削除されました',
    tr: 'Test Kapsamı Başarıyla Silindi',
    hu: 'Teszteset sikeresen törölve',
  },
  deletefailed_case: {
    zh: '删除测试用例失败',
    en: 'Failed to Delete Test Case',
    ja: 'テストケースの削除に失敗しました',
    tr: 'Test Kapsamı Silme Başarısız',
    hu: 'Teszteset törlése sikertelen',
  },
  case_info_incomplete: {
    zh: '存在信息不完整的测试用例，请检查.请确保用例名称、发送、预期不为空',
    en: 'There are incomplete test cases, please check. Make sure that the case name, send, and expected fields are not empty',
    ja: '不完全なテストケースがあります。ケース名、送信、および期待フィールドが空でないことを確認してください',
    tr: 'Eksik test kapsamları var, lütfen kontrol edin. Durum adı, gönder ve beklenen alanların boş olmadığından emin olun',
    hu: 'Hiányzó tesztesetek vannak, kérjük, ellenőrizze. Győződjön meg róla, hogy a teszteset neve, küldés és várt mezők nem üresek',
  },
  run_testplan: {
    zh: '运行测试计划',
    en: 'Run Test Plan',
    ja: 'テスト計画を実行',
    tr: 'Test Planı Çalıştır',
    hu: 'Tesztterv futtatása',
  },
  stop_testplan: {
    zh: '停止测试计划',
    en: 'Stop Test Plan',
    ja: 'テスト計画を停止',
    tr: 'Test Planı Durdur',
    hu: 'Tesztterv leállítása',
  },
  connect_info_invalidate: {
    zh: '连接信息已经失效，请在连接页面确认',
    en: 'Connection information has become invalid, please confirm on the connection page',
    ja: '接続情報が無効になりました。接続ページで確認してください',
    tr: 'Bağlantı bilgileri geçersiz hale geldi, lütfen bağlantı sayfasında doğrulayın',
    hu: 'A kapcsolati információ érvénytelen lett, kérjük, ellenőrizze a kapcsolati oldalon',
  },
  send_topic: {
    zh: '发送',
    en: 'Send',
    ja: '送信',
    tr: 'Gönder',
    hu: 'Küldés',
  },
  subscribe_topic: {
    zh: '订阅',
    en: 'Subscribe',
    ja: '購読',
    tr: 'Abone Ol',
    hu: 'Feliratkozás',
  },
  case_count: {
    zh: '用例总数',
    en: 'Total Cases',
    ja: 'ケース総数',
    tr: 'Toplam Kapsamlar',
    hu: 'Összes eset',
  },
  failed_case_count: {
    zh: '失败',
    en: 'Failed',
    ja: '失敗',
    tr: 'Başarısız',
    hu: 'Sikertelen',
  },
  successed_case_count: {
    zh: '成功',
    en: 'Successful',
    ja: '成功',
    tr: 'Başarılı',
    hu: 'Sikeres',
  },
  export: {
    zh: '导出测试计划',
    en: 'Export Test Plan',
    ja: 'テスト計画のエクスポート',
    tr: 'Test Planını Dışa Aktar',
    hu: 'Tesztterv exportálása',
  },
  import: {
    zh: '导入',
    en: 'Import',
    ja: 'インポート',
    tr: 'İçe Aktar',
    hu: 'Importálás',
  },
  test_plan_exist: {
    zh: '测试计划已存在',
    en: 'Test Plan Already Exists',
    ja: 'テスト計画は既に存在しています',
    tr: 'Test Planı Zaten Var',
    hu: 'A tesztterv már létezik',
  },
  del_case_group_confirm: {
    zh: '是否确实要删除此选项卡？',
    en: 'Are you sure you want to delete this tab?',
    ja: 'このタブを削除してもよろしいですか？',
    tr: 'Bu sekme silinsin mi emin misiniz?',
    hu: 'Biztosan törölni szeretné ezt a lapot?',
  },
}