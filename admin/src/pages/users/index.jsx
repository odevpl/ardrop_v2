import FetchWrapper from 'components/FetchWrapper'
import Table from 'components/Table'
import { getUsers } from '../../services/users'
import { getUsersTableConfig } from './table.config'

const Users = ({ payload }) => {
  return <Table config={getUsersTableConfig()} data={payload?.data ?? payload} />
}

const UsersWrapper = () => {
  return <FetchWrapper component={Users} name="Uzytkownicy" connector={getUsers} />
}

export default UsersWrapper
