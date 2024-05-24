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
    send_topic: '',
    receive_topic: '',
  }
}

export default {}
