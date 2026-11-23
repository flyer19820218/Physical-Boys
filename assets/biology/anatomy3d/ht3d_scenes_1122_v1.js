/* 3D 場景清單。新增一個器官場景＝在這裡加一行，其餘檔案不用動。
 *   id     ：場景代號（HT3D.go('<id>', 步驟, 毫秒) 用）
 *   file   ：場景檔（匯出 SCENE 與 STEPS，格式照 ht3d_scene_small_intestine_1122_v1.js）
 *   label  ：[中文, English]，場景選單上的字（兩個以上場景時才會出現選單）
 * 多人同時開發時：每個場景用自己的檔案（場景檔、中心線 json；要新增模型就另外用自己的 glb，不要改別人的檔），
 * 只有這個清單與 PROGRESS.md 最上面那一行會碰到同一個地方，push 前先 git pull --rebase。 */
export const SCENES = {
  small_intestine: { file: './ht3d_scene_small_intestine_1122_v1.js', label: ['小腸路線', 'Small intestine'] },
  kidney: { file: './ht3d_scene_kidney_1122_v1.js', label: ['腎臟路線', 'Kidney'] },
  liver: { file: './ht3d_scene_liver_1122_v1.js', label: ['肝臟路線', 'Liver'] },
  lung: { file: './ht3d_scene_lung_1122_v1.js', label: ['肺循環（小循環）', 'Pulmonary circulation'] },
  brain: { file: './ht3d_scene_brain_1122_v1.js', label: ['腦部：組織細胞', 'Brain: tissue cells'] }
};
