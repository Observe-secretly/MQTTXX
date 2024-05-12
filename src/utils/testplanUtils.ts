export const getDefaultRecord = (): TestplanModel => {
  return {
    id: '',
    name: '',
    connection_id: '',
    protocol_version: '',
    payload_type: '',
    create_persion: '',
    resp_timeout: 3,
    retry_num: 0,
  }
}

export default {}
