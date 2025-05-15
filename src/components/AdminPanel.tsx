import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useClipboard,
  Alert,
  AlertIcon,
  AlertDescription,
  Center,
  Spinner,
  HStack,
} from '@chakra-ui/react';
import { useWeb3 } from '../contexts/Web3Context';
import { CopyIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';

interface Poll {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  options: string[];
}

const AdminPanel: React.FC = () => {
  const { whitelistContract, votingContract } = useWeb3();
  const toast = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [removeAddress, setRemoveAddress] = useState('');
  const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>([]);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollStartDate, setPollStartDate] = useState('');
  const [pollStartTime, setPollStartTime] = useState('');
  const [pollEndDate, setPollEndDate] = useState('');
  const [pollEndTime, setPollEndTime] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add these helper functions at the top of the component
  const formatDateForInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseInputDate = (dateStr: string): Date | null => {
    const [day, month, year] = dateStr.split('/').map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month - 1, day);
    return date;
  };

  const dateTimeToTimestamp = (date: string, time: string): number => {
    const parsedDate = parseInputDate(date);
    if (!parsedDate) return 0;
    
    const [hours, minutes] = time.split(':').map(Number);
    parsedDate.setHours(hours, minutes);
    return Math.floor(parsedDate.getTime() / 1000);
  };

  const timestampToDateTime = (timestamp: number): { date: string; time: string } => {
    const date = new Date(timestamp * 1000);
    return {
      date: formatDateForInput(date),
      time: date.toTimeString().split(' ')[0].slice(0, 5)
    };
  };

  const getMinDate = (): string => {
    return formatDateForInput(new Date());
  };

  // Add function to validate dates
  const validateDates = (startTimestamp: number, endTimestamp: number): string | null => {
    const now = Math.floor(Date.now() / 1000);
    
    if (startTimestamp <= now) {
      return 'Start time must be in the future';
    }
    
    if (endTimestamp <= startTimestamp) {
      return 'End time must be after start time';
    }
    
    return null;
  };

  useEffect(() => {
    loadPolls();
    loadWhitelistedAddresses();
  }, [votingContract, whitelistContract]);

  const loadPolls = async () => {
    if (!votingContract) return;

    try {
      const count = await votingContract.getPollsCount();
      const pollsData: Poll[] = [];

      for (let i = 0; i < count; i++) {
        const info = await votingContract.getPollInfo(i);
        pollsData.push({
          id: i,
          title: info[0],
          description: info[1],
          startTime: Number(info[2]),
          endTime: Number(info[3]),
          isActive: info[4],
          options: info[5],
        });
      }

      setPolls(pollsData);
    } catch (error) {
      console.error('Error loading polls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load polls',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadWhitelistedAddresses = async () => {
    if (!whitelistContract) {
      console.error('Whitelist contract not initialized');
      toast({
        title: 'Error',
        description: 'Whitelist contract not initialized. Please check your connection.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      console.log('Fetching whitelisted addresses...');
      const addresses = await whitelistContract.getWhitelistedAddresses();
      console.log('Received addresses:', addresses);
      setWhitelistedAddresses(addresses);
    } catch (error) {
      console.error('Error loading whitelisted addresses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLoadError(errorMessage);
      toast({
        title: 'Error',
        description: `Failed to load whitelisted addresses: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!whitelistContract || !newAddress) return;

    try {
      const tx = await whitelistContract.addToWhitelist(newAddress);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Address added to whitelist',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewAddress('');
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add address to whitelist',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRemoveFromWhitelist = async (address: string) => {
    if (!whitelistContract) return;

    try {
      const tx = await whitelistContract.removeFromWhitelist(address);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Address removed from whitelist',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setRemoveAddress('');
      // Reload the list
      loadWhitelistedAddresses();
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove address from whitelist',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreatePoll = async () => {
    if (!votingContract || !pollTitle || !pollDescription || pollOptions.length < 2) return;

    try {
      // Convert date and time to timestamps
      const startTimestamp = dateTimeToTimestamp(pollStartDate, pollStartTime);
      const endTimestamp = dateTimeToTimestamp(pollEndDate, pollEndTime);
      
      // Validate dates
      const validationError = validateDates(startTimestamp, endTimestamp);
      if (validationError) {
        toast({
          title: 'Error',
          description: validationError,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Filter out empty options
      const validOptions = pollOptions.filter(option => option.trim() !== '');
      if (validOptions.length < 2) {
        toast({
          title: 'Error',
          description: 'Poll must have at least 2 non-empty options',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const duration = endTimestamp - startTimestamp;

      console.log('Creating poll with parameters:', {
        title: pollTitle,
        description: pollDescription,
        startTime: startTimestamp,
        duration: duration,
        options: validOptions
      });

      const tx = await votingContract.createPoll(
        pollTitle,
        pollDescription,
        startTimestamp,
        duration,
        validOptions
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'Poll created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setPollTitle('');
      setPollDescription('');
      setPollStartDate('');
      setPollStartTime('');
      setPollEndDate('');
      setPollEndTime('');
      setPollOptions(['', '']);
      
      // Reload polls
      loadPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      let errorMessage = 'Failed to create poll';
      
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          const revertReason = error.message.match(/reason="([^"]+)"/)?.[1];
          if (revertReason) {
            errorMessage = revertReason;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEndPoll = async (pollId: number) => {
    if (!votingContract) return;

    try {
      const tx = await votingContract.endPoll(pollId);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Poll ended successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadPolls();
    } catch (error) {
      console.error('Error ending poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to end poll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    // Only allow removal if there are more than 2 options
    if (pollOptions.length <= 2) return;
    
    const newOptions = pollOptions.filter((_, i) => i !== index);
    setPollOptions(newOptions);
  };

  // Add function to check if poll is truly active
  const isPollActive = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return poll.isActive && 
           currentTime >= poll.startTime && 
           currentTime <= poll.endTime;
  };

  // Add function to get poll status text
  const getPollStatus = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (!poll.isActive) return "Ended";
    if (currentTime < poll.startTime) return "Not Started";
    if (currentTime > poll.endTime) return "Time Expired";
    return "Active";
  };

  const AddressRow: React.FC<{ address: string }> = ({ address }) => {
    const { hasCopied, onCopy } = useClipboard(address);
    
    return (
      <Tr>
        <Td>
          <Text fontSize="sm" fontFamily="monospace">
            {address.slice(0, 6)}...{address.slice(-4)}
          </Text>
        </Td>
        <Td isNumeric>
          <IconButton
            aria-label="Copy address"
            icon={<CopyIcon />}
            size="sm"
            onClick={onCopy}
            mr={2}
          />
          <IconButton
            aria-label="Remove from whitelist"
            icon={<DeleteIcon />}
            size="sm"
            colorScheme="red"
            onClick={() => handleRemoveFromWhitelist(address)}
          />
        </Td>
      </Tr>
    );
  };

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Create Poll</Tab>
          <Tab>Manage Whitelist</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="md" mb={4}>Create New Poll</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Title</FormLabel>
                    <Input
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="Enter poll title"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={pollDescription}
                      onChange={(e) => setPollDescription(e.target.value)}
                      placeholder="Enter poll description"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Options</FormLabel>
                    <VStack spacing={2}>
                      {pollOptions.map((option, index) => (
                        <HStack key={index} width="100%">
                          <Input
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          {pollOptions.length > 2 && (
                            <IconButton
                              aria-label="Remove option"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => removePollOption(index)}
                            />
                          )}
                        </HStack>
                      ))}
                      <Button 
                        onClick={addPollOption} 
                        leftIcon={<AddIcon />} 
                        colorScheme="blue" 
                        variant="outline"
                        alignSelf="flex-start"
                      >
                        Add Option
                      </Button>
                    </VStack>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Start Date and Time</FormLabel>
                    <Box 
                      borderWidth={1} 
                      borderRadius="lg" 
                      p={4} 
                      bg="white" 
                      boxShadow="sm"
                    >
                      <VStack spacing={4}>
                        <Box width="100%">
                          <FormLabel fontSize="sm" color="gray.600">Date</FormLabel>
                          <Input
                            type="text"
                            value={pollStartDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only numbers and forward slashes
                              if (/^[0-9/]*$/.test(value)) {
                                // Format as user types
                                let formatted = value.replace(/[^0-9]/g, '');
                                if (formatted.length > 0) {
                                  if (formatted.length > 2) {
                                    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                                  }
                                  if (formatted.length > 5) {
                                    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
                                  }
                                }
                                setPollStartDate(formatted);
                              }
                            }}
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                            }}
                          />
                        </Box>
                        <Box width="100%">
                          <FormLabel fontSize="sm" color="gray.600">Time</FormLabel>
                          <Input
                            type="time"
                            value={pollStartTime}
                            onChange={(e) => setPollStartTime(e.target.value)}
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                            }}
                          />
                        </Box>
                      </VStack>
                    </Box>
                  </FormControl>

                  <FormControl>
                    <FormLabel>End Date and Time</FormLabel>
                    <Box 
                      borderWidth={1} 
                      borderRadius="lg" 
                      p={4} 
                      bg="white" 
                      boxShadow="sm"
                    >
                      <VStack spacing={4}>
                        <Box width="100%">
                          <FormLabel fontSize="sm" color="gray.600">Date</FormLabel>
                          <Input
                            type="text"
                            value={pollEndDate}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow only numbers and forward slashes
                              if (/^[0-9/]*$/.test(value)) {
                                // Format as user types
                                let formatted = value.replace(/[^0-9]/g, '');
                                if (formatted.length > 0) {
                                  if (formatted.length > 2) {
                                    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
                                  }
                                  if (formatted.length > 5) {
                                    formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
                                  }
                                }
                                setPollEndDate(formatted);
                              }
                            }}
                            placeholder="DD/MM/YYYY"
                            maxLength={10}
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                            }}
                          />
                        </Box>
                        <Box width="100%">
                          <FormLabel fontSize="sm" color="gray.600">Time</FormLabel>
                          <Input
                            type="time"
                            value={pollEndTime}
                            onChange={(e) => setPollEndTime(e.target.value)}
                            _focus={{
                              borderColor: 'blue.400',
                              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                            }}
                          />
                        </Box>
                      </VStack>
                    </Box>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    onClick={handleCreatePoll}
                    isDisabled={
                      !pollTitle || 
                      !pollDescription || 
                      !pollStartDate || 
                      !pollStartTime || 
                      !pollEndDate || 
                      !pollEndTime || 
                      pollOptions.length < 2
                    }
                  >
                    Create Poll
                  </Button>
                </VStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="md" mb={4}>Active Polls</Heading>
                <VStack spacing={4} align="stretch">
                  {polls.map((poll) => (
                    <Box
                      key={poll.id}
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      bg={isPollActive(poll) ? 'white' : 'gray.50'}
                    >
                      <Heading size="sm">{poll.title}</Heading>
                      <Text color="gray.600" mt={2}>{poll.description}</Text>
                      <Text fontSize="sm" mt={2}>
                        Status: {getPollStatus(poll)}
                      </Text>
                      <Text fontSize="sm">
                        Options: {poll.options.join(', ')}
                      </Text>
                      {isPollActive(poll) && (
                        <Button
                          colorScheme="red"
                          size="sm"
                          mt={2}
                          onClick={() => handleEndPoll(poll.id)}
                        >
                          End Poll
                        </Button>
                      )}
                      {poll.isActive && !isPollActive(poll) && (
                        <Button
                          colorScheme="orange"
                          size="sm"
                          mt={2}
                          onClick={() => handleEndPoll(poll.id)}
                        >
                          Close Expired Poll
                        </Button>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="md" mb={4}>Add to Whitelist</Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Ethereum Address</FormLabel>
                    <Input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="0x..."
                      isDisabled={isLoading}
                    />
                  </FormControl>
                  <Button
                    colorScheme="blue"
                    onClick={handleAddToWhitelist}
                    isDisabled={!newAddress || isLoading}
                    isLoading={isLoading}
                  >
                    Add to Whitelist
                  </Button>
                </VStack>
              </Box>

              <Divider my={6} />

              <Box>
                <Heading size="md" mb={4}>Whitelisted Addresses</Heading>
                {loadError && (
                  <Alert status="error" mb={4}>
                    <AlertIcon />
                    <AlertDescription>{loadError}</AlertDescription>
                  </Alert>
                )}
                {isLoading ? (
                  <Center p={8}>
                    <Spinner size="xl" />
                  </Center>
                ) : whitelistedAddresses.length > 0 ? (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Address</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {whitelistedAddresses.map((address) => (
                        <AddressRow key={address} address={address} />
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500" textAlign="center">
                    No addresses in whitelist
                  </Text>
                )}
                <Button
                  mt={4}
                  size="sm"
                  onClick={loadWhitelistedAddresses}
                  isLoading={isLoading}
                >
                  Refresh List
                </Button>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPanel; 